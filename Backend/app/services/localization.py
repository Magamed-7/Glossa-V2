LOCALES = ('en', 'ru', 'tg')


def pick_locale(obj, field_prefix: str, locale: str):
    if locale not in LOCALES:
        locale = 'en'

    value = getattr(obj, f'{field_prefix}_{locale}', None)

    if value:
        return value

    return getattr(obj, f'{field_prefix}_en', None)
