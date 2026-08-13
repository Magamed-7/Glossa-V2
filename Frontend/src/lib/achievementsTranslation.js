export const translateAchievement = (achievement, locale = "ru") => {
  const { code, title, description } = achievement;
  
  if (locale === "en") {
    return { title, description };
  }

  // Parse threshold count from code (e.g. "words_50" -> 50)
  const threshold = parseInt(code.split("_").pop(), 10) || 0;

  // 1. Russian Translations
  if (locale === "ru") {
    // Exact mapping for special achievements
    const specialTitles = {
      words_10: "Первые 10 слов",
      words_50: "50 изученных слов",
      words_100: "100 изученных слов",
      words_500: "500 изученных слов",
      streak_7: "Неделя ударного режима",
      streak_30: "Месяц ударного режима",
      streak_100: "100 дней ударного режима",
      friends_5: "5 друзей",
      friends_20: "20 друзей",
      reviews_5: "5 выполненных повторений",
      stories_written_1: "Первая история",
      stories_written_5: "5 написанных историй",
      stories_written_20: "20 написанных историй",
      stories_sold_1: "Первая продажа",
      stories_sold_10: "10 продаж",
      reviews_received_10: "10 полученных отзывов",
    };

    if (specialTitles[code]) {
      // Descriptions for specials
      const specialDescs = {
        words_10: "Выучите свои первые 10 слов в личной колоде.",
        words_50: "Выучите 50 слов в своей личной колоде.",
        words_100: "Выучите 100 слов в своей личной колоде.",
        words_500: "Выучите 500 слов в своей личной колоде.",
        streak_7: "Поддерживайте ударный режим активного обучения в течение 7 дней.",
        streak_30: "Поддерживайте ударный режим активного обучения в течение 30 дней.",
        streak_100: "Поддерживайте ударный режим активного обучения в течение 100 дней.",
        friends_5: "Подключитесь к 5 друзьям в сообществе.",
        friends_20: "Подключитесь к 20 друзьям в сообществе.",
        reviews_5: "Выполните 5 повторений словарных карточек.",
        stories_written_1: "Напишите и опубликуйте свою первую историю в библиотеке.",
        stories_written_5: "Напишите и опубликуйте 5 историй в библиотеке.",
        stories_written_20: "Напишите и опубликуйте 20 историй в библиотеке.",
        stories_sold_1: "Продайте свою опубликованную историю первому учащемуся.",
        stories_sold_10: "Продайте свои опубликованные истории 10 учащимся.",
        reviews_received_10: "Получите 10 отзывов на свои опубликованные истории.",
      };
      return {
        title: specialTitles[code],
        description: specialDescs[code] || description,
      };
    }

    // Dynamic pattern-based translations
    if (code.startsWith("words_")) {
      return {
        title: `Словарный запас: Уровень ${threshold}`,
        description: `Изучите в общей сложности ${threshold} слов в своей личной колоде.`,
      };
    }
    if (code.startsWith("streak_")) {
      return {
        title: `Ударный режим: ${threshold} дн.`,
        description: `Поддерживайте ударный режим активного обучения в течение ${threshold} дней.`,
      };
    }
    if (code.startsWith("friends_")) {
      return {
        title: `Общительность: Уровень ${threshold}`,
        description: `Подключитесь к ${threshold} друзьям в сообществе.`,
      };
    }
    if (code.startsWith("reviews_received_")) {
      return {
        title: `Популярный автор: Уровень ${threshold}`,
        description: `Получите ${threshold} отзывов на свои опубликованные истории.`,
      };
    }
    if (code.startsWith("reviews_")) {
      return {
        title: `Интервальное повторение: Уровень ${threshold}`,
        description: `Выполните ${threshold} повторений словарных карточек.`,
      };
    }
    if (code.startsWith("stories_written_")) {
      return {
        title: `Автор: Уровень ${threshold}`,
        description: `Напишите и опубликуйте ${threshold} историй в библиотеке.`,
      };
    }
    if (code.startsWith("stories_sold_")) {
      return {
        title: `Издатель: Уровень ${threshold}`,
        description: `Продайте свои опубликованные истории ${threshold} учащимся.`,
      };
    }
  }

  // 2. Tajik Translations
  if (locale === "tg") {
    const specialTitlesTg = {
      words_10: "10 вожаи аввал",
      words_50: "50 вожаи омӯхташуда",
      words_100: "100 вожаи омӯхташуда",
      words_500: "500 вожаи омӯхташуда",
      streak_7: "Як ҳафтаи пайвастагӣ",
      streak_30: "Як моҳи пайвастагӣ",
      streak_100: "100 рӯзи пайвастагӣ",
      friends_5: "5 дӯст",
      friends_20: "20 дӯст",
      reviews_5: "5 такрори иҷрошуда",
      stories_written_1: "Ҳикояи аввалин",
      stories_written_5: "5 ҳикояи навишташуда",
      stories_written_20: "20 ҳикояи навишташуда",
      stories_sold_1: "Фурӯши аввалин",
      stories_sold_10: "10 фурӯш",
      reviews_received_10: "10 тақризи гирифташуда",
    };

    if (specialTitlesTg[code]) {
      const specialDescsTg = {
        words_10: "10 вожаи аввалини худро дар дастаи шахсӣ омӯзед.",
        words_50: "50 вожаро дар дастаи шахсии худ омӯзед.",
        words_100: "100 вожаро дар дастаи шахсии худ омӯзед.",
        words_500: "500 вожаро дар дастаи шахсии худ омӯзед.",
        streak_7: "Пайвастагии омӯзиши фаъолро барои 7 рӯз нигоҳ доред.",
        streak_30: "Пайвастагии омӯзиши фаъолро барои 30 рӯз нигоҳ доред.",
        streak_100: "Пайвастагии омӯзиши фаъолро барои 100 рӯз нигоҳ доред.",
        friends_5: "Бо 5 дӯст дар ҷомеа пайваст шавед.",
        friends_20: "Бо 20 дӯст дар ҷомеа пайваст шавед.",
        reviews_5: "5 такрори кортҳои луғавиро иҷро кунед.",
        stories_written_1: "Ҳикояи аввалини худро дар китобхона нависед ва нашр кунед.",
        stories_written_5: "5 ҳикояро дар китобхона нависед ва нашр кунед.",
        stories_written_20: "20 ҳикояро дар китобхона нависед ва нашр кунед.",
        stories_sold_1: "Ҳикояи нашршудаи худро ба омӯзандаи аввалин фурӯшед.",
        stories_sold_10: "Ҳикояҳои нашршудаи худро ба 10 омӯзанда фурӯшед.",
        reviews_received_10: "10 тақриз ба ҳикояҳои нашршудаи худ гиред.",
      };
      return {
        title: specialTitlesTg[code],
        description: specialDescsTg[code] || description,
      };
    }

    if (code.startsWith("words_")) {
      return {
        title: `Сатҳи захираи луғавӣ: ${threshold}`,
        description: `Ҳамагӣ ${threshold} вожаро дар дастаи шахсии худ омӯзед.`,
      };
    }
    if (code.startsWith("streak_")) {
      return {
        title: `Пайвастагӣ: ${threshold} рӯз`,
        description: `Пайвастагии омӯзиши фаъолро барои ${threshold} рӯз нигоҳ доред.`,
      };
    }
    if (code.startsWith("friends_")) {
      return {
        title: `Сатҳи муошират: ${threshold}`,
        description: `Бо ${threshold} дӯст дар ҷомеа пайваст шавед.`,
      };
    }
    if (code.startsWith("reviews_received_")) {
      return {
        title: `Муаллифи машҳур: Сатҳи ${threshold}`,
        description: `${threshold} тақриз ба ҳикояҳои нашршудаи худ гиред.`,
      };
    }
    if (code.startsWith("reviews_")) {
      return {
        title: `Сатҳи такрори фосилавӣ: ${threshold}`,
        description: `${threshold} такрори кортҳои луғавиро иҷро кунед.`,
      };
    }
    if (code.startsWith("stories_written_")) {
      return {
        title: `Муаллиф: Сатҳи ${threshold}`,
        description: `${threshold} ҳикояро дар китобхона нависед ва нашр кунед.`,
      };
    }
    if (code.startsWith("stories_sold_")) {
      return {
        title: `Ношир: Сатҳи ${threshold}`,
        description: `Ҳикояҳои нашршудаи худро ба ${threshold} омӯзанда фурӯшед.`,
      };
    }
  }

  // Fallback to original
  return { title, description };
};
