import { createContext, useContext, useState } from "react"

const LanguageContext = createContext(null)

const LANGUAGES = ["uz", "en", "ru"]

const translations = {
  brand: { uz: "DevsClub.uz", en: "DevsClub.uz", ru: "DevsClub.uz" },
  nav_assignments: { uz: "Topshiriqlar", en: "Assignments", ru: "Задания" },
  nav_rating: { uz: "Reyting", en: "Rating", ru: "Рейтинг" },
  nav_grades: { uz: "Baholar", en: "Grades", ru: "Оценки" },
  nav_students: { uz: "O'quvchilar", en: "Students", ru: "Ученики" },

  loading: { uz: "Yuklanmoqda...", en: "Loading...", ru: "Загрузка..." },
  save: { uz: "Saqlash", en: "Save", ru: "Сохранить" },
  cancel: { uz: "Bekor qilish", en: "Cancel", ru: "Отмена" },
  edit: { uz: "Tahrirlash", en: "Edit", ru: "Изменить" },
  delete: { uz: "O'chirish", en: "Delete", ru: "Удалить" },
  back: { uz: "Orqaga", en: "Back", ru: "Назад" },
  logout: { uz: "Chiqish", en: "Logout", ru: "Выйти" },
  not_set: { uz: "Belgilanmagan", en: "Not set", ru: "Не указано" },

  // Teacher dashboard
  hello_teacher: { uz: "Salom, Ustoz", en: "Hello, Teacher", ru: "Здравствуйте, Учитель" },
  teacher_subtitle: {
    uz: "Bugungi o'quv jarayoni va topshiriqlar holatini kuzatib boring.",
    en: "Keep track of today's learning process and assignment status.",
    ru: "Следите за учебным процессом и статусом заданий сегодня."
  },
  stat_total_assignments: { uz: "Jami topshiriqlar", en: "Total Assignments", ru: "Всего заданий" },
  stat_pending_review: { uz: "Baholanmagan", en: "Pending Review", ru: "Не проверено" },
  stat_active_students: { uz: "Faol o'quvchilar", en: "Active Students", ru: "Активные ученики" },
  create_assignment: { uz: "Topshiriq yaratish", en: "Create Assignment", ru: "Создать задание" },
  topic_name: { uz: "Mavzu nomi", en: "Topic Name", ru: "Название темы" },
  topic_placeholder: { uz: "Mavzu nomini kiriting", en: "Enter the topic name", ru: "Введите название темы" },
  deadline_label: { uz: "Muddat (sana va soat)", en: "Deadline (date & time)", ru: "Срок (дата и время)" },
  submit: { uz: "Yuborish", en: "Submit", ru: "Отправить" },
  submitted_assignments: { uz: "Yuborilgan topshiriqlar", en: "Submitted Assignments", ru: "Отправленные задания" },
  total_label: { uz: "JAMI", en: "TOTAL", ru: "ВСЕГО" },
  no_assignments_yet: { uz: "Hali topshiriqlar yo'q", en: "No Assignments Yet", ru: "Заданий пока нет" },
  submissions_label: { uz: "TOPSHIRILGANLAR", en: "SUBMISSIONS", ru: "ОТПРАВЛЕНО" },
  show_less: { uz: "Kamroq ko'rsatish", en: "Show Less", ru: "Показать меньше" },
  view_all: { uz: "Barchasini ko'rish", en: "View All", ru: "Смотреть все" },

  welcome_back: { uz: "Xush kelibsiz", en: "Welcome Back", ru: "С возвращением" },
  hi: { uz: "Salom", en: "Hi", ru: "Привет" },
  student_summary: {
    uz: (total, pending) => `Sizda jami ${total} ta topshiriq bor, ${pending} tasi hali bajarilmagan. O'qishni davom eting!`,
    en: (total, pending) => `You have ${total} assignment${total === 1 ? "" : "s"} total, ${pending} still pending. Keep up the learning!`,
    ru: (total, pending) => `У вас всего ${total} заданий, ${pending} ещё не выполнено. Продолжайте учиться!`
  },
  current_assignments: { uz: "Joriy topshiriqlar", en: "Current Assignments", ru: "Текущие задания" },
  filter_all: { uz: "Hammasi", en: "All", ru: "Все" },
  filter_pending: { uz: "Bajarilmagan", en: "Pending", ru: "Ожидают" },
  no_assignments_here: { uz: "Bu yerda topshiriq yo'q", en: "No assignments here", ru: "Здесь нет заданий" },
  teacher_label: { uz: "Ustoz", en: "Teacher", ru: "Учитель" },
  submitted: { uz: "Topshirildi", en: "Submitted", ru: "Отправлено" },
  not_submitted: { uz: "Topshirilmagan", en: "Not submitted", ru: "Не отправлено" },
  late_badge: { uz: "Kech", en: "Late", ru: "Опоздание" },
}

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'uz')

  const changeLang = (code) => {
    if (!LANGUAGES.includes(code)) return
    setLang(code)
    localStorage.setItem('app_lang', code)
  }

  const t = (key, ...args) => {
    const entry = translations[key]
    if (!entry) return key
    const value = entry[lang] ?? entry.en
    return typeof value === "function" ? value(...args) : value
  }

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}