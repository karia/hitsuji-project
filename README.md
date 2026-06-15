# hitsuji-project

GitHub Pages で配信する静的サイト。現在は「サイト作成予定地」のみの雛形段階です。

- 配信元: `main` ブランチの `docs/` 配下（GitHub Pages）
- ビルド: Tailwind CSS v4（`@tailwindcss/cli`）＋ `sharp` による画像最適化

## セットアップ

ツールチェーンは [mise](https://mise.jdx.dev/) で管理しています。

```bash
git clone https://github.com/karia/hitsuji-project
cd hitsuji-project

mise install   # mise.toml の node / prek を取得
mise up        # 取得済みツールを最新へ更新

npm install    # tailwindcss / sharp / biome / prettier を取得
prek install   # pre-commit hook を Git に登録
```

## ビルド

```bash
npm run build       # 画像 + CSS を一括ビルド
npm run build:css   # CSS のみビルド（docs/assets/style.css を生成）
npm run watch:css   # CSS の監視ビルド
npm run build:images # 画像のみ再生成（raw/images/ に元画像が必要）
```

`docs/index.html` をブラウザで開くと表示を確認できます。

## 画像運用

ソース画像と配信用画像を分離して管理します。

- ソース画像（編集元）: `raw/images/`
- ページ表示用画像（WebP）: `docs/assets/img/`
- ダウンロード用画像（PNG）: `docs/assets/downloads/`

`raw/images/` に元画像を置き `npm run build:images` を実行すると、最適化済み画像を生成します。

## Lint / Format

pre-commit hook（[prek](https://github.com/j178/prek)）で自動整形・検査します。

- Biome: JS / JSON / CSS の整形・lint
- Prettier: HTML の整形
- pre-commit-hooks: 末尾空白・改行などの基本チェック

手動実行する場合:

```bash
prek run --all-files
```

## 補足 / 後日の課題

- カスタムドメインが必要になれば `docs/CNAME` を追加し、DNS を設定する
- 画像コンテンツを追加する際は `raw/images/` に元画像を置き `npm run build` で WebP / favicon を生成する
- リポジトリの description は未設定。必要なら `gh repo edit` 等で設定する
