/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_QIITA_ORG_ID?: string
	readonly VITE_QIITA_ACCESS_TOKEN?: string
	readonly VITE_PER_PAGE?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
