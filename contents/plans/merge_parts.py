"""Merge part-files into final content JSONs.

Usage: python merge_parts.py <level_dir> [kind]
  level_dir — e.g. "../Elementary" (relative to this script) or absolute path
  kind      — Grammar (default) | Stories

Grammar: <level>/Grammar/parts/{en,ru,tg}_{N}.json -> grammar_extract_{loc}.json
Stories: <level>/Stories/parts/{en,ru,tg}_{N}.json -> stories_{loc}.json
"""
import json
import os
import re
import sys


def merge(level_dir, kind='Grammar'):
    sub = os.path.join(level_dir, kind)
    parts_dir = os.path.join(sub, 'parts')
    if not os.path.isdir(parts_dir):
        print(f'no parts dir: {parts_dir}')
        return
    out_name = 'grammar_extract_{loc}.json' if kind == 'Grammar' else 'stories_{loc}.json'
    for loc in ('en', 'ru', 'tg'):
        files = sorted(
            (f for f in os.listdir(parts_dir) if re.fullmatch(rf'{loc}_\d+\.json', f)),
            key=lambda f: int(f.split('_')[1].split('.')[0]),
        )
        if not files:
            print(f'  {loc}: no parts, skipped')
            continue
        merged = []
        for f in files:
            with open(os.path.join(parts_dir, f), encoding='utf-8') as fh:
                merged.extend(json.load(fh))
        out = os.path.join(sub, out_name.format(loc=loc))
        with open(out, 'w', encoding='utf-8') as fh:
            json.dump(merged, fh, ensure_ascii=False, indent=1)
        print(f'  {loc}: {len(files)} parts -> {len(merged)} items -> {os.path.basename(out)}')


if __name__ == '__main__':
    level = sys.argv[1] if len(sys.argv) > 1 else None
    kind = sys.argv[2] if len(sys.argv) > 2 else 'Grammar'
    if not level:
        sys.exit('usage: merge_parts.py <level_dir> [Grammar|Stories]')
    base = os.path.dirname(os.path.abspath(__file__))
    level_dir = level if os.path.isabs(level) else os.path.abspath(os.path.join(base, level))
    print(f'merging {kind} in {level_dir}')
    merge(level_dir, kind)
