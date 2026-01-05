<h1 align="center">
  <img src="../electron/app.ico" alt="VRChat Event Creator" width="96" height="96" align="middle" />&nbsp;VRChat Event Creator
</h1>
<p align="center">
  <a href="https://github.com/Cynacedia/VRC-Event-Creator/releases">
    <img src="https://img.shields.io/github/downloads/Cynacedia/VRC-Event-Creator/total?style=plastic&labelColor=555&color=blue" alt="Downloads" />
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
  <a href="README.ru.md">Русский</a>
</p>
VRChat向けのオールインワンなイベント作成ツールで、繰り返しの設定作業をなくします。
グループごとのイベントテンプレートを作成・保存し、シンプルな繰り返しパターンから今後の日程を生成して詳細を即時に自動入力 - 週次の集まり、視聴会、コミュニティイベントを素早くスケジュールするのに最適です。


<p align="center">
  <img src=".imgs/1MP-CE_CreationFlow-01-05-26.gif" width="900" alt="Event creation flow (profile to publish)" />
</p>


## 特長
- グループごとにイベント詳細を自動入力するプロフィール/テンプレート。
- 繰り返しパターン生成（次回候補リスト + 手動の日時入力）。
- グループカレンダー向けのイベント作成ウィザード。
- 今後のイベント用の「イベント編集」ビュー（グリッド + 編集モーダル）。
- プリセット付きテーマスタジオとUIカラーの完全制御（#RRGGBBAA対応）。
- 画像ID用のギャラリー選択・アップロード。
- 初回起動時の言語選択付きローカライズ（en, fr, es, de, ja, zh, pt, ko, ru）。

## ダウンロード
- リリース: https://github.com/Cynacedia/VRC-Event-Creator/releases
- Windowsのポータブル`.exe`は単体で動作します。

## プライバシーとデータ保存
パスワードは保存されません。セッショントークンのみキャッシュされます。
アプリのファイルはElectronのユーザーデータディレクトリに保存されます（設定 > アプリ情報 に表示）：

- `profiles.json`（プロファイルテンプレート）
- `cache.json`（セッショントークン）
- `settings.json`（アプリ設定）
- `themes.json`（テーマプリセットとカスタムカラー）

`VRC_EVENT_DATA_DIR`の環境変数で保存先ディレクトリを変更できます。
初回起動時、アプリはプロジェクトフォルダ内の既存`profiles.json`のインポートを試みます。

__**キャッシュファイルやアプリのデータフォルダは共有しないでください。**__

## 使用上の注意
- プロフィールにはプロフィール名、イベント名、説明が必要です。
- 非公開グループはアクセス種別を「グループ」のみにできます。
- 時間は DD:HH:MM 形式で、最大 31 日です。
- タグは最大 5、言語は最大 3 です。
- ギャラリーのアップロードは PNG/JPG、64-2048 px、10MB 未満、1アカウント64枚まで。
- VRChat は同時に最大 10 件の今後のイベントまで対応しています。

## トラブルシューティング
- ログインできない場合：`cache.json`を削除して再ログインしてください（データフォルダはアプリ情報に表示）。
- グループが見つからない場合：対象グループでカレンダー権限が必要です。
- レート制限：VRChatがイベント作成を制限する場合があります。待って再試行し、失敗が続く場合は停止してください。更新やイベント作成ボタンを連打しないでください。
- 更新: 更新待ちの間、一部機能がブロックされます。最新リリースをダウンロードして実行してください。

## 免責事項
- このプロジェクトはVRChatとは無関係で、VRChatによる承認もありません。自己責任でご利用ください。
- 翻訳は機械翻訳のため不正確な場合があります。修正にご協力ください。

## 要件（ソースからビルド）
- Node.js 20+（22.21.1推奨）
- npm
- 少なくとも1つのグループでイベントを作成できるVRChatアカウント




