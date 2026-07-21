# Glossa content pipeline — прогресс (обновлять по ходу!)

## Решения (подтверждены пользователем 2026-07-06)
- Контент хранится в `Glossa/contents/` (JSON), уровни: корень=Beginner(A1), подпапки Elementary(A2), Pre-Intermediate(B1), Intermediate(B2), Upper-Intermediate(C1).
- Трёхъязычность: локале-поля в grammar/stories (`title_ru/tg`, `explanation_ru/tg`, `content_ru/tg`, `translation`(=ru)/`translation_tg`), API принимает `?locale=en|ru|tg`, фронтенд передаёт локаль из useLocale.
- CEFR-маппинг: A1/A2/B1/B2/C1. Объём: 2 истории/юнит для новых уровней, 6 вопросов/урок, ~25 слов/юнит.
- Планы уровней: contents/plans/content_plan_*.json (структура из книг English File 4e — только факты, весь контент оригинальный).

## Сделано
- [x] Миграции: grammar 0005, stories 0004, content 0003 (локале-поля + cefr_level в unique_together). Применены.
- [x] load_glossa_content переписан: level-aware, грузит content-таблицы + GrammarLesson(+examples+questions) + Story(+words). Natural key: tags=`seed:{CEFR}:grammar:{idx}` / `seed:{CEFR}:story:{idx}`. Формат новых уровней: grammar_extract_en с полями questions[{type,text,options,answer,explanation}], tip; ru/tg файлы index-aligned (questions только text/explanation); stories_en с words[{word,translation_ru,translation_tg,part_of_speech,context}]; vocab с translation_ru/tg.
- [x] Сериализаторы grammar/stories локализованы (pick_locale, фолбэк EN; translation: ru база, tg отдельно).
- [x] Фронтенд: grammar/page, grammar/[id], stories/page, stories/[id] передают `locale=` и рефетчат при смене.
- [x] A1 загружен: 523 vocab, 69 topics, 23 lessons, 60 stories. API проверен (200, ru/tg работают).
- [x] QA-пользователь: qa@glossa.test / QaTest12345! (JWT через RefreshToken.for_user).

## Осталось
- [x] Beginner: questions_{en,ru,tg}.json готовы и загружены (138 вопросов, проверено в БД).
- [x] Elementary (A2) ГОТОВ и загружен: 36 уроков + 216 вопросов + 144 примера; 24 истории + 192 StoryWords; 139 слов. Пайплайн: part-файлы в <Level>/{Grammar,Stories}/parts/{en,ru,tg}_{1,2}.json → contents/plans/merge_parts.py <level> [Grammar|Stories] → load_glossa_content --level A2. Формат grammar item: {unit,lesson,topic,rule_en,structure,examples_en[4],tip,questions[6:{type,text,options,answer,explanation}]}; ru/tg — те же ключи, questions только {text,explanation}. Формат story item (en): {book_unit,json_unit_source,grammar_topic,cefr_level,genre,title,body,words[8:{word,translation_ru,translation_tg,part_of_speech,context}]}; ru/tg — без words. Vocab: {unit,word,part_of_speech,example_en,translation_ru,translation_tg,cefr_level}.
- [ ] Pre-Intermediate (B1): та же схема, 36 уроков/24 истории/вокаб. ← ТЕКУЩИЙ ШАГ
- [ ] Beginner: StoryWords с переводами (опционально — words_used без переводов; можно добавить поле words в stories_en.json)
- [ ] Elementary (A2): grammar_extract_{en,ru,tg} (36 уроков), stories_{en,ru,tg} (24), vocab_extract (~300) + загрузка + чек
- [ ] Pre-Intermediate (B1): то же (36 уроков, 24 истории)
- [ ] Intermediate (B2): то же (20 уроков, 20 историй)
- [ ] Upper-Intermediate (C1): то же (20 уроков, 20 историй)
- [ ] СТОП-ТОЧКА: спросить пользователя перед массовой загрузкой всех уровней (Beginner уже загружен как smoke-test)
- [ ] Отладка: achievements сигнал ругается «storyteller не найдено» при сохранении Story; пройти прохождение урока end-to-end; финальный отчёт
- Беглый бэклог отладки: i18n-audit-report.md — захардкоженные строки на страницах уроков (не блокер)

## Beginner: 23 темы по индексам (для questions_*.json)
0 be sg I/you; 1 be sg he/she/it; 2 be pl; 3 Wh/How + be; 4 sg/pl nouns a/an; 5 this/that/these/those;
6 possessive adj + 's; 7 adjectives; 8 PS +/- I/you/we/they; 9 PS ? I/you/we/they; 10 PS he/she/it;
11 adverbs of frequency; 12 word order in questions; 13 imperatives+object pronouns; 14 can/can't;
15 like/love/hate+ing; 16 present continuous; 17 PC vs PS; 18 there is/are; 19 past simple be;
20 PS regular; 21 PS irregular get/go/have/do; 22 PS review

## Как проверять
Backend: `cd Backend && .venv/Scripts/python.exe manage.py runserver` (без Docker!).
Загрузка: `PYTHONIOENCODING=utf-8 .venv/Scripts/python.exe manage.py load_glossa_content [--level A2]`.
API: /api/grammar/lessons/?locale=ru, /api/grammar/lessons/<id>/?locale=tg, /api/stories/?locale=tg, /api/stories/<id>/?locale=ru — с Bearer-токеном.
