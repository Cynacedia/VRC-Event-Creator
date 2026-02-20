<h1 align="center">
  <img src="../electron/app.ico" alt="VRChat Event Creator" width="96" height="96" align="middle" />&nbsp;VRChat Event Creator
</h1>
<p align="center">
  <a href="https://github.com/Cynacedia/VRC-Event-Creator/releases">
    <img src="https://gist.githubusercontent.com/Cynacedia/30c5da7160619ca08933e7e3e92afcc3/raw/downloads-badge.svg" alt="Downloads" />
  </a>
</p>
<p align="center">
  <a href="../README.md">English</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.zh.md">中文（简体）</a> |
  <a href="README.pt.md">Português</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.nl.md">Nederlands</a>
</p>

VRChat向けの便利機能満載なイベント作成ツールで手動での繰り返しの設定作業を軽減します。グループ毎にイベントテンプレートを作成・保存できたり、繰り返し設定で今後の日程を自動生成できたりします！集会や視聴会、コミュニティイベントを素早くスケジュールするのに最適です。 


<p align="center">
  <img src=".imgs/1MP-CE_CreationFlow-01-05-26.gif" width="900" alt="イベント作成フロー（テンプレートから公開まで）" />
</p>


## 機能紹介
- グループ毎にイベント概要を自動入力できるテンプレート機能
- 指定した情報で次回開催日のパターン等を生成できる機能
- イベント自動化システム（実験的） - テンプレのパターンに基き自動的にイベントを投稿する機能
- グループカレンダー用のイベント作成ウィザード機能
- 開催予定のイベントを編集するためのビュー（グリッド・モーダル式）
- 追加で権限設定を利用するグループ向けのイベントオプション対応可
- テーマスタジオにて任意のUIカラーに設定可能（#RRGGBBAA対応）
- 画像IUD設定用のギャラリー・アップロード機能
- システム起動時に開始 + システムトレイに最小化可
- 単一インスタンス保護機能で二重インスタンスの起動を防止可
- 初回起動時にローカライズ（en, fr, es, de, ja, zh, pt, ko, ru, nl）対応可

## ダウンロード
- リリース: https://github.com/Cynacedia/VRC-Event-Creator/releases

## プライバシーとデータの保存について
パスワードは保存されません。セッショントークンのみキャッシュされます。 アプリのファイルはElectronのユーザーデータディレクトリに保存されます（設定 > アプリ情報）：

- `profiles.json`（イベントテンプレート）
- `cache.json`（セッショントークン）
- `settings.json`（アプリ設定）
- `themes.json`（テーマプリセットとカスタムカラー）
- `pending-events.json`（自動化キュー）
- `automation-state.json`（自動化追跡）

`VRC_EVENT_DATA_DIR`の環境変数で保存先ディレクトリを変更できます。
初回起動時、アプリはプロジェクトフォルダ内の既存`profiles.json`のインポートを試みます。

__**注意：キャッシュファイルやアプリのデータフォルダを他者と共有しないでください**__

## 使用上の注意
- テンプレートにはテンプレート名、イベント名、そして概要が必要となります
- 非公開グループの場合、アクセス種は「グループ」のみご利用いただけます
- 時間表示はDD:HH:MM 形式、最大で31日まで設定できます
- 指定できる最大タグ数は５、最大言語数は３です
- アカウント１つにつきギャラリーのアップロードは最64枚まで、形式はPNG・JPGのみ（10MB未満・64~2048px）
- VRChatの仕様上、イベント作成は1時間当たり1人1グループにつき10件までとなっております
- イベントの自動化をご利用になる場合、アプリケーションが開いている必要があります。自動化に失敗した場合は手動で設定出来ます
- Featured Event等の特別な設定をする場合は該当する権限が必要となります。許可がある場合のみ表示されます

## トラブルシューティング
- ログインできない場合：`cache.json`を削除して再ログインしてください（データフォルダは設定 > アプリ情報に表示）。
- グループが見つからない場合：対象グループでカレンダー権限が必要です。
- レートが制限された場合：VRChatがイベント作成を制限する場合があります。その場合は一旦待って再試行し、失敗が続くようであれば一度時間を空けて再度アクセスを試みてください。更新やイベント作成ボタンを連打しないでください
- 更新: 更新待ちの間、一部機能がブロックされます。最新リリースをダウンロードして実行してください。

## 免責事項
- このプロジェクトはVRChatとは無関係で、VRChatによる承認もありません。自己責任でご利用ください。
- 翻訳は機械翻訳のため不正確な場合があります。修正にご協力ください。

## 要件（ソースからビルド）
- Node.js 20+（22.21.1推奨）
- npm
- 少なくとも1つのグループでイベントを作成できるVRChatアカウント

---

## クレジット
日本語翻訳: [🌸potato🌸](https://x.com/potatovrc)

