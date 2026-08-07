import asyncio
import sys
from pathlib import Path
from decimal import Decimal

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.model_user import Users
from app.models.model_user_story import UserStories, StoryPurchases, StoryReviews

AUTHOR_USERNAMES = {
    "lighthouse": "yunus",
    "interview": "amir",
    "market": "dilshod",
    "letters": "Carlos S.",
    "cartographer": "Ji-Yoon K.",
}

REVIEWER_USERNAMES = ["testuser", "Magamedjan", "ruslanjon", "wstest_12cb613e9a"]

STORIES = [
    {
        "key": "lighthouse",
        "title": "The Lighthouse Keeper's Radio",
        "description": "A quiet lighthouse keeper hears something strange on the radio every Tuesday night.",
        "cefr_level": "A1",
        "genre": "mystery",
        "price": None,
        "body": (
            "Every night, Mr. Andersson climbs the old stairs to the top of the lighthouse. "
            "He turns on his radio and listens. Most nights, he hears only music. "
            "But on Tuesdays, he hears a strange voice. The voice says three numbers, then stops. "
            "Mr. Andersson writes the numbers in a small book. He does not know who speaks. "
            "He does not know why.\n\n"
            "His daughter visits on Sundays. She asks, 'Papa, why do you listen every night?' "
            "He smiles and says, 'Someone out there needs to be heard.'\n\n"
            "Tonight, the voice says new numbers. Mr. Andersson looks at his book. "
            "The numbers match an old ship. A ship that disappeared thirty years ago. "
            "He picks up his phone and calls the harbor office. "
            "'I think,' he says slowly, 'someone is still out there.'"
        ),
        "reviews": [("testuser", 5, "Simple and sweet — perfect for beginners."),
                    ("Magamedjan", 4, "Nice slow pace, good for practicing present tense.")],
    },
    {
        "key": "interview",
        "title": "Late for the Interview",
        "description": "Everything that could go wrong on the way to a job interview, does.",
        "cefr_level": "A2",
        "genre": "comedy",
        "price": None,
        "body": (
            "Nora woke up late. Her alarm did not ring. She jumped out of bed and looked at the clock: 8:45. "
            "Her interview was at 9:30, across the city.\n\n"
            "She grabbed a shirt from the floor and put it on — it was inside out. "
            "She ran outside without her umbrella, and it started to rain. "
            "At the bus stop, she realized she left her phone at home. She could not check the map. "
            "A kind stranger showed her the way to the metro station.\n\n"
            "On the train, a man stepped on her shoe, and the heel broke. "
            "She arrived at the office at 9:32, wet, limping, and holding one shoe in her hand. "
            "The manager looked at her and laughed. 'You must really want this job,' she said.\n\n"
            "Nora got the position — not because of her clothes, but because she never stopped smiling, "
            "even in the rain."
        ),
        "reviews": [("ruslanjon", 5, "Made me laugh out loud, easy to follow."),
                    ("wstest_12cb613e9a", 4, "Good everyday vocabulary.")],
    },
    {
        "key": "market",
        "title": "The Market on Saturday",
        "description": "A chance meeting at a crowded Saturday market turns into an unexpected friendship.",
        "cefr_level": "B1",
        "genre": "slice of life",
        "price": Decimal("15.00"),
        "body": (
            "Saturday mornings in Dushanbe always begin the same way for Farrukh: the smell of fresh bread, "
            "the calls of vendors, and the crowded lanes of the old market. He had been coming here since he "
            "was a child, first holding his grandmother's hand, now carrying his own basket.\n\n"
            "This week, something was different. As he stopped to buy tomatoes, he noticed a young woman "
            "arguing quietly with a seller about the price of walnuts. She had clearly just moved to the city "
            "and did not know that bargaining was expected, even welcomed. Farrukh stepped in, not to take "
            "sides, but to explain the unspoken rules of the market with a smile.\n\n"
            "By the time they reached the tea stall, the woman — whose name was Elena — was laughing at her "
            "own mistake. They sat together, sharing green tea and stories, as the market noise rose and fell "
            "around them like a tide neither of them was in a hurry to leave."
        ),
        "reviews": [("testuser", 5, "Warm story, worth the price."),
                    ("Magamedjan", 5, "Loved the market details.")],
    },
    {
        "key": "letters",
        "title": "Letters to No One",
        "description": "After moving to the capital, Daler starts writing letters he never means to send.",
        "cefr_level": "B2",
        "genre": "drama",
        "price": Decimal("35.00"),
        "body": (
            "When Daler moved to the capital for work, he told himself the distance from his hometown would "
            "not matter. He had his job, his new apartment, his ambitions. What he had not planned for was "
            "the silence in the evenings, a silence loud enough that he began writing letters to Sami, his "
            "closest friend from school, though the two had not spoken in years.\n\n"
            "He never intended to send them. Each letter began the same way — 'I don't know why I'm writing "
            "this' — and ended differently, sometimes with a joke, sometimes with a confession he would never "
            "say aloud to anyone he actually knew. Writing became less about Sami and more about untangling "
            "the version of himself he had left behind.\n\n"
            "One evening, scrolling through an old contact list out of habit rather than hope, he found "
            "Sami's number, unchanged after all these years. His thumb hovered over the call button for a "
            "long moment before he finally, almost accidentally, pressed it."
        ),
        "reviews": [("ruslanjon", 4, "Really relatable, a bit sad though.")],
    },
    {
        "key": "cartographer",
        "title": "The Cartographer's Error",
        "description": "A cartographer uncovers a decades-old discrepancy that someone wanted forgotten.",
        "cefr_level": "C1",
        "genre": "mystery",
        "price": Decimal("60.00"),
        "body": (
            "Nilufar had redrawn the boundary of Chinor-Say a dozen times before she noticed the discrepancy: "
            "a narrow strip of land, no wider than a footpath, that appeared on every historical survey except "
            "the one filed in 1987. It was the kind of inconsistency any competent cartographer might dismiss "
            "as clerical oversight, were it not for the fact that the missing strip corresponded precisely to "
            "the site of the old grain silo — the same silo that, according to municipal record, had been "
            "quietly decommissioned that same year.\n\n"
            "She spent three evenings cross-referencing archives before the pattern crystallized into "
            "something closer to intention than accident: someone had redrawn the town's own map to erase a "
            "piece of it from official memory. Whether that erasure concealed negligence, corruption, or "
            "something altogether darker was a question Nilufar was no longer certain she wanted answered.\n\n"
            "And yet, as she traced the missing boundary line once more with her pencil, she understood she "
            "had already gone too far to stop asking."
        ),
        "reviews": [("wstest_12cb613e9a", 5, "Great vocabulary challenge, gripping plot."),
                    ("testuser", 4, "Loved the twist at the end.")],
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        existing = await db.execute(select(UserStories.title))
        existing_titles = {row[0] for row in existing.all()}

        author_users = {}
        for key, username in AUTHOR_USERNAMES.items():
            res = await db.execute(select(Users).where(Users.username == username))
            user = res.scalar_one_or_none()
            if user is None:
                print(f"Skipping seed: author '{username}' not found")
                return
            author_users[key] = user

        reviewer_users = {}
        for username in REVIEWER_USERNAMES:
            res = await db.execute(select(Users).where(Users.username == username))
            user = res.scalar_one_or_none()
            if user is not None:
                reviewer_users[username] = user

        created = 0
        for data in STORIES:
            if data["title"] in existing_titles:
                continue

            story = UserStories(
                author_id=author_users[data["key"]].id,
                title=data["title"],
                body=data["body"],
                description=data["description"],
                cefr_level=data["cefr_level"],
                genre=data["genre"],
                price=data["price"],
                status="published",
                views_count=0,
            )
            db.add(story)
            await db.commit()
            await db.refresh(story)
            created += 1

            for username, rating, text in data["reviews"]:
                reviewer = reviewer_users.get(username)
                if reviewer is None:
                    continue

                if data["price"] is not None:
                    db.add(StoryPurchases(story_id=story.id, buyer_id=reviewer.id))

                db.add(StoryReviews(story_id=story.id, user_id=reviewer.id, rating=rating, text=text))

            await db.commit()

        print(f"Seeded {created} new user_stories with reviews")


if __name__ == "__main__":
    asyncio.run(seed())
