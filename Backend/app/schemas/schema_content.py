from datetime import datetime

from pydantic import BaseModel, ConfigDict


class VocabResponse(BaseModel):
    id: int
    word: str
    part_of_speech: str | None
    example_en: str | None
    translation: str | None
    cefr_level: str
    unit: str | None
    transcription: str | None = None
    audio_url: str | None = None
    accent: str | None = None


class WordTranscriptionResponse(BaseModel):
    word: str
    transcription: str | None


class WordAudioResponse(BaseModel):
    word: str
    audio_url: str | None
    accent: str | None


class GrammarExampleResponse(BaseModel):
    id: int
    text: str
    order: int


class GrammarQuestionResponse(BaseModel):
    id: int
    type: str
    text: str | None
    options: list | None
    answer: str


class GrammarQuestionResultResponse(GrammarQuestionResponse):
    explanation: str | None
    is_correct: bool


class GrammarLessonResponse(BaseModel):
    id: int
    cefr_level: str
    unit: str | None
    lesson: str
    topic: str
    structure: str | None
    tip: str | None


class GrammarLessonDetailResponse(GrammarLessonResponse):
    rule: str | None
    examples: list[GrammarExampleResponse]
    questions: list[GrammarQuestionResponse]


class QuestionAnswer(BaseModel):
    question_id: int
    answer: str


class QuestionSubmit(BaseModel):
    answers: list[QuestionAnswer]


class GrammarSubmitResult(BaseModel):
    total: int
    correct: int
    results: list[GrammarQuestionResultResponse]


class WeakTopicResponse(BaseModel):
    topic: str
    attempts: int
    incorrect: int
    error_rate: float


class GrammarLevelProgress(BaseModel):
    level: str
    total_lessons: int
    completed_lessons: int
    percent: float


class GrammarProgressResponse(BaseModel):
    total_lessons: int
    completed_lessons: int
    percent: float
    by_level: list[GrammarLevelProgress]


class StoryWordResponse(BaseModel):
    id: int
    word: str
    translation_ru: str | None
    translation_tg: str | None
    part_of_speech: str | None
    context: str | None
    transcription: str | None = None
    audio_url: str | None = None
    accent: str | None = None


class StoryQuestionResponse(BaseModel):
    id: int
    text: str
    options: list | None


class StoryResponse(BaseModel):
    id: int
    title: str
    cefr_level: str
    genre: str | None
    grammar_topic: str | None
    image_url: str | None
    audio_url: str | None = None
    accent: str | None = None


class StoryDetailResponse(StoryResponse):
    body: str
    title_translated: str | None
    body_translated: str | None
    word_dictionary: dict | None = None
    words: list[StoryWordResponse]
    questions: list[StoryQuestionResponse]


class StoryListenResponse(BaseModel):
    audio_url: str | None
    accent: str | None


class ReadingProgressUpdate(BaseModel):
    is_completed: bool | None = None
    last_position: int | None = None


class ReadingProgressResponse(BaseModel):
    story_id: int
    is_completed: bool
    last_position: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StoryQuestionAnswer(BaseModel):
    question_id: int
    answer: str


class StoryQuestionsSubmit(BaseModel):
    answers: list[StoryQuestionAnswer]


class StoryQuestionResult(BaseModel):
    question_id: int
    is_correct: bool
    correct_answer: str
    explanation: str | None = None


class StoryQuestionsResult(BaseModel):
    total: int
    correct: int
    completed: bool
    results: list[StoryQuestionResult]
