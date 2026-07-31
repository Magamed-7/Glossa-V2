async def test_avatar_upload_rejects_disallowed_content_type(client, user, token):
    response = await client.post(
        '/profile/me/photo',
        files={'file': ('evil.svg', b'<svg onload=alert(1)></svg>', 'image/svg+xml')},
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 400
    assert response.json()['error']['code'] == 'UNSUPPORTED_FILE_TYPE'


async def test_avatar_upload_rejects_oversized_file(client, user, token):
    oversized = b'a' * (5 * 1024 * 1024 + 1)

    response = await client.post(
        '/profile/me/photo',
        files={'file': ('avatar.png', oversized, 'image/png')},
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 400
    assert response.json()['error']['code'] == 'FILE_TOO_LARGE'


async def test_card_audio_upload_rejects_disallowed_content_type(client, user, token):
    card_response = await client.post(
        '/deck/',
        json={'word': 'hello', 'translation': 'привет'},
        headers={'Authorization': f'Bearer {token}'},
    )
    card_id = card_response.json()['id']

    response = await client.post(
        f'/deck/{card_id}/audio',
        files={'file': ('evil.html', b'<script>alert(1)</script>', 'text/html')},
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 400
    assert response.json()['error']['code'] == 'UNSUPPORTED_FILE_TYPE'
