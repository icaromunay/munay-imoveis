import email
import imaplib
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from email.header import decode_header, make_header
from email.utils import parsedate_to_datetime
from pathlib import Path

ARTIFACTS_DIR = Path('/home/user/validation_workspace3/tmp-validation-artifacts')
META_FILE = ARTIFACTS_DIR / 'password-reset-meta.json'
TOKEN_FILE = ARTIFACTS_DIR / 'password-reset-token.json'

RESET_LINK_PATTERN = re.compile(r'https?://[^\s"\']+/reset-password\?token=([^\s"\'&<>]+)')


def decode_subject(raw_value: str) -> str:
    if not raw_value:
        return ''
    try:
        return str(make_header(decode_header(raw_value)))
    except Exception:
        return raw_value


def extract_bodies(message):
    texts = []
    htmls = []

    if message.is_multipart():
        for part in message.walk():
            content_type = part.get_content_type()
            disposition = str(part.get('Content-Disposition') or '')
            if 'attachment' in disposition.lower():
                continue
            payload = part.get_payload(decode=True)
            if payload is None:
                continue
            charset = part.get_content_charset() or 'utf-8'
            try:
                decoded = payload.decode(charset, errors='replace')
            except Exception:
                decoded = payload.decode('utf-8', errors='replace')
            if content_type == 'text/plain':
                texts.append(decoded)
            elif content_type == 'text/html':
                htmls.append(decoded)
    else:
        payload = message.get_payload(decode=True)
        if payload is not None:
            charset = message.get_content_charset() or 'utf-8'
            try:
                decoded = payload.decode(charset, errors='replace')
            except Exception:
                decoded = payload.decode('utf-8', errors='replace')
            if message.get_content_type() == 'text/html':
                htmls.append(decoded)
            else:
                texts.append(decoded)

    return '\n'.join(texts), '\n'.join(htmls)


def extract_token(content: str):
    match = RESET_LINK_PATTERN.search(content or '')
    if not match:
        return None, None
    token = match.group(1)
    return token, match.group(0)


def message_datetime(message):
    raw_date = message.get('Date')
    if not raw_date:
        return None
    try:
        parsed = parsedate_to_datetime(raw_date)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except Exception:
        return None


def main():
    if not META_FILE.exists():
        raise SystemExit('Meta file not found for inbox validation.')

    meta = json.loads(META_FILE.read_text())
    started_at = datetime.fromisoformat(meta['startedAt'].replace('Z', '+00:00')).astimezone(timezone.utc)
    expected_test_subject = meta['expectedTestSubject']
    expected_reset_subject = meta['expectedResetSubject']

    username = os.environ.get('SMTP_USER', 'imob@munay.com.br').strip()
    password = os.environ.get('SMTP_PASS', '').strip()

    if not password:
        raise SystemExit('SMTP_PASS is required to inspect the Titan inbox.')

    imap_host = os.environ.get('IMAP_HOST', 'imap.titan.email').strip() or 'imap.titan.email'
    imap_port = int(os.environ.get('IMAP_PORT', '993'))

    deadline = time.time() + 180
    found_test = None
    found_reset = None

    while time.time() < deadline and (found_test is None or found_reset is None):
        with imaplib.IMAP4_SSL(imap_host, imap_port) as mailbox:
            mailbox.login(username, password)
            mailbox.select('INBOX')
            status, data = mailbox.search(None, 'ALL')
            if status != 'OK':
                raise SystemExit('Failed to search inbox via IMAP.')

            message_ids = data[0].split()
            for message_id in reversed(message_ids[-30:]):
                status, fetched = mailbox.fetch(message_id, '(RFC822)')
                if status != 'OK':
                    continue
                raw_email = None
                for part in fetched:
                    if isinstance(part, tuple):
                        raw_email = part[1]
                        break
                if not raw_email:
                    continue

                message = email.message_from_bytes(raw_email)
                subject = decode_subject(message.get('Subject', ''))
                msg_dt = message_datetime(message)
                if msg_dt and msg_dt < started_at:
                    continue

                text_body, html_body = extract_bodies(message)
                combined = '\n'.join([subject, text_body, html_body])

                if found_test is None and expected_test_subject.lower() in subject.lower():
                    found_test = {
                        'subject': subject,
                        'receivedAt': msg_dt.isoformat() if msg_dt else None,
                    }

                if found_reset is None and expected_reset_subject.lower() in subject.lower():
                    token, reset_link = extract_token(combined)
                    if token and reset_link:
                        found_reset = {
                            'subject': subject,
                            'receivedAt': msg_dt.isoformat() if msg_dt else None,
                            'token': token,
                            'resetLink': reset_link,
                        }

                if found_test is not None and found_reset is not None:
                    break

        if found_test is None or found_reset is None:
            time.sleep(5)

    if found_test is None:
        raise SystemExit('O e-mail de teste SMTP não chegou à caixa de entrada dentro do tempo esperado.')

    if found_reset is None:
        raise SystemExit('O e-mail de recuperação de senha não chegou à caixa de entrada dentro do tempo esperado.')

    TOKEN_FILE.write_text(json.dumps({
        'token': found_reset['token'],
        'resetLink': found_reset['resetLink'],
        'testEmailReceivedAt': found_test['receivedAt'],
        'resetEmailReceivedAt': found_reset['receivedAt'],
        'testSubject': found_test['subject'],
        'resetSubject': found_reset['subject'],
    }, indent=2) + '\n')

    print(json.dumps({
        'ok': True,
        'inboxConfirmed': True,
        'testSubject': found_test['subject'],
        'resetSubject': found_reset['subject'],
        'resetLink': found_reset['resetLink'],
    }, indent=2))


if __name__ == '__main__':
    main()
