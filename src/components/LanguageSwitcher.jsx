import { useLanguage } from "../Providers/LanguageProvider"

const LABELS = { uz: "UZ", en: "EN", ru: "RU" }

const LanguageSwitcher = () => {
  const { lang, changeLang, LANGUAGES } = useLanguage()

  return (
    <div className="flex items-center bg-[#0e1b52] rounded-full p-1 gap-0.5">
      {LANGUAGES.map((code) => (
        <button
          key={code}
          onClick={() => changeLang(code)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
            lang === code ? "bg-indigo-600 text-white" : "text-indigo-300 hover:text-white"
          }`}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher