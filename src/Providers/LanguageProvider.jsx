import { createContext, useContext, useState } from "react"

const LanguageContext = createContext(null)

const LANGUAGES = ["uz", "en", "ru"]

const translations = {
  brand: { uz: "DevsClub.uz", en: "DevsClub.uz", ru: "DevsClub.uz" },
  nav_assignments: { uz: "Topshiriqlar", en: "Assignments", ru: "Задания" },
  nav_rating: { uz: "Reyting", en: "Rating", ru: "Рейтинг" },
  nav_grades: { uz: "Baholar", en: "Grades", ru: "Оценки" },
  nav_students: { uz: "O'quvchilar", en: "Students", ru: "Ученики" },
  nav_lessons: { uz: "Darslar", en: "Lessons", ru: "Уроки" },
  lessons_title: { uz: "Darslar", en: "Lessons", ru: "Уроки" },
  lessons_subtitle: { uz: "Kurslar bo'yicha darslar va faoliyatlarni boshqaring.", en: "Manage lessons and activities across your courses.", ru: "Управляйте уроками и заданиями курсов." },
  create_lesson: { uz: "Dars yaratish", en: "Create lesson", ru: "Создать урок" },
  lesson_saved: { uz: "Dars saqlandi", en: "Lesson saved", ru: "Урок сохранён" },
  activity_saved: { uz: "Faoliyat saqlandi", en: "Activity saved", ru: "Задание сохранено" },
  // Quiz builder + taking
  quiz_questions: { uz: "Test savollari", en: "Quiz questions", ru: "Вопросы теста" },
  quiz_add_question: { uz: "Savol qo'shish", en: "Add question", ru: "Добавить вопрос" },
  quiz_questions_hint: { uz: "Kamida bitta to'liq savol kerak (2+ variant bilan). To'g'ri javobni belgilang.", en: "Add at least one complete question (2+ options). Mark the correct answer.", ru: "Добавьте хотя бы один полный вопрос (2+ варианта). Отметьте правильный ответ." },
  quiz_question_text: { uz: "Savol matni", en: "Question text", ru: "Текст вопроса" },
  quiz_correct_answer: { uz: "To'g'ri javob", en: "Correct answer", ru: "Правильный ответ" },
  quiz_option: { uz: "Variant", en: "Option", ru: "Вариант" },
  quiz_need_questions: { uz: "Test uchun kamida bitta savol qo'shing", en: "Add at least one question to the quiz", ru: "Добавьте хотя бы один вопрос к тесту" },
  quiz_result: { uz: "Natija", en: "Result", ru: "Результат" },
  quiz_use_score: { uz: "Ball sifatida ishlatish", en: "Use as grade", ru: "Использовать как оценку" },
  quiz_answer_all: { uz: "Barcha savollarga javob bering", en: "Answer all questions", ru: "Ответьте на все вопросы" },
  quiz_your_score: { uz: "Sizning natijangiz", en: "Your score", ru: "Ваш результат" },
  quiz_answers_submitted: { uz: "Javoblaringiz yuborildi ✓", en: "Answers submitted ✓", ru: "Ответы отправлены ✓" },
  quiz_start_title: { uz: "Testni boshlashga tayyormisiz?", en: "Ready to start the quiz?", ru: "Готовы начать тест?" },
  quiz_start_btn: { uz: "Boshlash", en: "Start", ru: "Начать" },
  quiz_start_info: { uz: (n) => `${n} ta savol · har biriga 30 soniya`, en: (n) => `${n} questions · 30 seconds each`, ru: (n) => `${n} вопросов · 30 секунд на каждый` },
  quiz_attempts_left: { uz: (n) => `Qolgan urinishlar: ${n}`, en: (n) => `Attempts left: ${n}`, ru: (n) => `Осталось попыток: ${n}` },
  quiz_no_attempts: { uz: "Urinishlar tugadi — bu testni boshqa ishlab bo'lmaydi", en: "No attempts left — this quiz can no longer be taken", ru: "Попытки исчерпаны — тест больше недоступен" },
  quiz_last_attempt: { uz: "Oxirgi urinish! Xato bo'lsa qayta ishlab bo'lmaydi", en: "Last attempt! No retakes after this", ru: "Последняя попытка! Пересдачи не будет" },
  quiz_timer_hint: { uz: "Taymer avtomatik yuboradi — javobni oldindan belgilab qo'ying", en: "The timer auto-submits — pick answers before time runs out", ru: "Таймер отправит автоматически — выбирайте ответы заранее" },
  quiz_question_of: { uz: (a, b) => `Savol ${a}/${b}`, en: (a, b) => `Question ${a} of ${b}`, ru: (a, b) => `Вопрос ${a} из ${b}` },
  quiz_prev: { uz: "Orqaga", en: "Back", ru: "Назад" },
  quiz_next: { uz: "Keyingi", en: "Next", ru: "Далее" },
  quiz_finish: { uz: "Tugatish", en: "Finish", ru: "Завершить" },
  quiz_sending: { uz: "Natijalar o'qituvchiga yuborilmoqda...", en: "Sending results to your teacher...", ru: "Результаты отправляются учителю..." },
  quiz_sending_sub: { uz: "Yakunlanishini kutib turing", en: "Please wait while we finish up", ru: "Пожалуйста, подождите" },
  quiz_retake_btn: { uz: "Qayta ishlash", en: "Retake", ru: "Пройти снова" },
  // CSV export
  export_csv: { uz: "Excel'ga yuklash (CSV)", en: "Export CSV", ru: "Экспорт CSV" },
  export_no_data: { uz: "Eksport uchun ma'lumot yo'q", en: "Nothing to export yet", ru: "Нет данных для экспорта" },
  export_done: { uz: "Fayl yuklab olindi", en: "File downloaded", ru: "Файл скачан" },
  student_label: { uz: "O'quvchi", en: "Student", ru: "Ученик" },
  assignment_label: { uz: "Topshiriq", en: "Assignment", ru: "Задание" },
  deadline_reminder: {
    uz: (label) => `Topshiriqqa ${label} qoldi!`,
    en: (label) => `Due in ${label}!`,
    ru: (label) => `До сдачи ${label}!`,
  },
  select_lesson: { uz: "Darsni tanlang", en: "Select a lesson", ru: "Выберите урок" },
  no_lessons_for_student: { uz: "Sizning kurslaringizda hali dars yo'q.", en: "There are no lessons in your courses yet.", ru: "В ваших курсах пока нет уроков." },
  lesson_activities: { uz: "Dars faoliyatlari", en: "Lesson activities", ru: "Задания урока" },
  teacher_students_eyebrow: { uz: "Akademik panel", en: "Academic panel", ru: "Академическая панель" },
  teacher_students_title: { uz: "O'quvchilar ro'yxati", en: "Student Directory", ru: "Список учеников" },
  teacher_students_subtitle: { uz: "O'quvchilarning topshiriq va baholash jarayonini kuzating.", en: "Track student assignment progress and results.", ru: "Отслеживайте прогресс и результаты учеников." },
  search_students: { uz: "O'quvchi ismi yoki emailini qidiring...", en: "Search by student name or email...", ru: "Поиск по имени или email ученика..." },
  all_courses: { uz: "Barcha kurslar", en: "All courses", ru: "Все курсы" },
  student_count: { uz: (count) => `${count} ta o'quvchi`, en: (count) => `${count} students`, ru: (count) => `${count} учеников` },
  completed_assignments: { uz: "Bajarilgan vazifalar", en: "Completed assignments", ru: "Выполненные задания" },
  no_students: { uz: "O'quvchilar topilmadi", en: "No students found", ru: "Ученики не найдены" },
  more_actions: { uz: "Qo'shimcha amallar", en: "More actions", ru: "Другие действия" },
  student_page: { uz: (total, page, pages) => `Jami ${total} ta • ${page}/${pages}-sahifa`, en: (total, page, pages) => `${total} total • Page ${page} of ${pages}`, ru: (total, page, pages) => `Всего ${total} • Страница ${page} из ${pages}` },

  loading: { uz: "Yuklanmoqda...", en: "Loading...", ru: "Загрузка..." },
  save: { uz: "Saqlash", en: "Save", ru: "Сохранить" },
  cancel: { uz: "Bekor qilish", en: "Cancel", ru: "Отмена" },
  edit: { uz: "Tahrirlash", en: "Edit", ru: "Изменить" },
  delete: { uz: "O'chirish", en: "Delete", ru: "Удалить" },
  back: { uz: "Orqaga", en: "Back", ru: "Назад" },
  logout: { uz: "Chiqish", en: "Logout", ru: "Выйти" },
  not_set: { uz: "Belgilanmagan", en: "Not set", ru: "Не указано" },

  hello_teacher: { uz: "Salom, Ustoz", en: "Hello, Teacher", ru: "Здравствуйте, Учитель" },
  teacher_subtitle: {
    uz: "Bugungi o'quv jarayoni va topshiriqlar holatini kuzatib boring.",
    en: "Keep track of today's learning process and assignment status.",
    ru: "Следите за учебным процессом и статусом заданий сегодня."
  },
  stat_total_assignments: { uz: "Jami topshiriqlar", en: "Total Assignments", ru: "Всего заданий" },
  stat_pending_review: { uz: "Baholanmagan", en: "Pending Review", ru: "Не проверено" },
  stat_active_students: { uz: "Faol o'quvchilar", en: "Active Students", ru: "Активные ученики" },
  teacher_workspace: { uz: "Ustoz ish maydoni", en: "Teacher workspace", ru: "Рабочее пространство учителя" },
  pending_reviews: { uz: "Kutilayotgan tekshiruvlar", en: "Pending reviews", ru: "Ожидают проверки" },
  academic_flow: { uz: "O'quv jarayoni", en: "Academic flow", ru: "Учебный процесс" },
  create_lesson_first: { uz: "Avval dars yarating", en: "Create a lesson first", ru: "Сначала создайте урок" },
  lesson_flow_hint: { uz: "Dars yarating, keyin ichiga uy ishi, imtihon, test yoki material qo'shing.", en: "Create a lesson, then add homework, exam, quiz, or materials inside it.", ru: "Создайте урок, затем добавьте домашнюю работу, экзамен, тест или материалы." },
  close_lesson_form: { uz: "Dars formasini yopish", en: "Close lesson form", ru: "Закрыть форму урока" },
  create_lesson_here: { uz: "Shu yerda dars yaratish", en: "Create lesson here", ru: "Создать урок здесь" },
  lesson_created: { uz: "Dars yaratildi", en: "Lesson created", ru: "Урок создан" },
  select_course: { uz: "Kursni tanlang", en: "Select a course", ru: "Выберите курс" },
  lesson_title: { uz: "Dars nomi", en: "Lesson title", ru: "Название урока" },
  description_optional: { uz: "Tavsif (ixtiyoriy)", en: "Description (optional)", ru: "Описание (необязательно)" },
  save_lesson: { uz: "Darsni saqlash", en: "Save lesson", ru: "Сохранить урок" },
  created_this_session: { uz: "Shu sessiyada yaratilgan", en: "Created in this session", ru: "Создано в этой сессии" },
  activity_title: { uz: "Faoliyat nomi", en: "Activity title", ru: "Название активности" },
  instructions_optional: { uz: "Ko'rsatmalar (ixtiyoriy)", en: "Instructions (optional)", ru: "Инструкции (необязательно)" },
  link_optional: { uz: "Havola (ixtiyoriy)", en: "Link (optional)", ru: "Ссылка (необязательно)" },
  add_activity: { uz: "Qo'shish", en: "Add", ru: "Добавить" },
  added_to_lesson: { uz: "Darsga qo'shildi", en: "Added to this lesson", ru: "Добавлено в этот урок" },
  finish_lesson: { uz: "Darsni yakunlash", en: "Finish lesson", ru: "Завершить урок" },
  course_content: { uz: "Kurs tarkibi", en: "Course content", ru: "Содержание курса" },
  recent_lessons: { uz: "So'nggi darslar", en: "Recent lessons", ru: "Последние уроки" },
  manage_lessons: { uz: "Darslarni boshqarish", en: "Manage lessons", ru: "Управление уроками" },
  no_lessons_created: { uz: "Hali dars yaratilmagan. Yuqoridagi formadan boshlang.", en: "No lessons created yet. Start with the lesson composer above.", ru: "Уроки ещё не созданы. Начните с формы выше." },
  activity_homework: { uz: "Uy ishi", en: "Homework", ru: "Домашняя работа" },
  activity_exam: { uz: "Imtihon", en: "Exam", ru: "Экзамен" },
  activity_quiz: { uz: "Test", en: "Quiz", ru: "Тест" },
  activity_materials: { uz: "Material", en: "Material", ru: "Материал" },
  lessons_loading: { uz: "Darslar yuklanmoqda...", en: "Loading lessons...", ru: "Загрузка уроков..." },
  no_lessons: { uz: "Hali darslar yo'q.", en: "No lessons yet.", ru: "Уроков пока нет." },
  lesson_content_hint: { uz: "Bu kursdagi darslar va ichidagi vazifalar.", en: "Lessons and activities inside this course.", ru: "Уроки и задания внутри этого курса." },
  no_activities: { uz: "Bu darsda hali faoliyat yo'q.", en: "No activities in this lesson yet.", ru: "В этом уроке пока нет заданий." },
  attendance: { uz: "Yo'qlama", en: "Attendance", ru: "Посещаемость" },
  mark_attendance: { uz: "Yo'qlamani belgilash", en: "Mark attendance", ru: "Отметить посещаемость" },
  present: { uz: "Bor", en: "Present", ru: "Присутствует" },
  absent: { uz: "Yo'q", en: "Absent", ru: "Отсутствует" },
  late: { uz: "Kechikdi", en: "Late", ru: "Опоздал" },
  no_attendance: { uz: "Hali yo'qlama belgilanmagan.", en: "Attendance has not been marked yet.", ru: "Посещаемость ещё не отмечена." },
  attendance_saved: { uz: "Yo'qlama saqlandi", en: "Attendance saved", ru: "Посещаемость сохранена" },
  attendance_error: { uz: "Yo'qlamani saqlashda xato", en: "Error saving attendance", ru: "Ошибка сохранения посещаемости" },
  activity_deadline: { uz: "Muddat (sana va soat)", en: "Deadline (date & time)", ru: "Срок (дата и время)" },
  student_id: { uz: "O'quvchi ID", en: "Student ID", ru: "ID ученика" },
  student_email_or_id: { uz: "Email, ID raqam yoki Student ID kiriting", en: "Enter email, numeric ID, or Student ID", ru: "Введите email, числовой ID или Student ID" },
  add_student_hint: { uz: "Email, ID raqamini yoki Student ID (masalan: 12345) kiriting", en: "Enter email, numeric ID, or Student ID (e.g. 12345)", ru: "Введите email, числовой ID или Student ID (например: 12345)" },
  student_performance: { uz: "O'quvchi natijalari", en: "Student performance", ru: "Успеваемость ученика" },
  my_rating: { uz: "Mening reytingim", en: "My Rating", ru: "Мой рейтинг" },
  rating_progress_hint: { uz: "Topshirilgan va baholangan uy ishlaringiz natijasi.", en: "Your real progress across submitted and graded homework.", ru: "Ваш прогресс по отправленным и оценённым работам." },
  choose_course: { uz: "Kursni tanlang", en: "Choose course", ru: "Выберите курс" },
  your_score: { uz: "Sizning balingiz", en: "Your score", ru: "Ваш балл" },
  points: { uz: "ball", en: "points", ru: "баллов" },
  overall_ranking: { uz: "Umumiy reyting", en: "Overall ranking", ru: "Общий рейтинг" },
  your_rank: { uz: "Sizning o'rningiz", en: "Your rank", ru: "Ваше место" },
  graded_count: { uz: (count) => `${count} ta baholangan`, en: (count) => `${count} graded`, ru: (count) => `${count} оценено` },
  loading_results: { uz: "Natijalar yuklanmoqda...", en: "Loading results...", ru: "Загрузка результатов..." },
  no_assignments_course: { uz: "Bu kursda hali topshiriqlar yo'q.", en: "No assignments in this course yet.", ru: "В этом курсе пока нет заданий." },
  no_rating_data: { uz: "Hali reyting ma'lumotlari yo'q.", en: "No rating data yet.", ru: "Данных рейтинга пока нет." },
  weekly: { uz: "Haftalik", en: "Weekly", ru: "За неделю" },
  monthly: { uz: "Oylik", en: "Monthly", ru: "За месяц" },
  mood_excellent: { uz: "A'lo", en: "Excellent", ru: "Отлично" },
  mood_great: { uz: "Juda yaxshi", en: "Great", ru: "Отлично" },
  mood_good: { uz: "Yaxshi", en: "Good", ru: "Хорошо" },
  mood_keep_going: { uz: "Davom eting", en: "Keep going", ru: "Продолжайте" },
  mood_no_score_yet: { uz: "Hali ball yo'q", en: "No score yet", ru: "Оценки пока нет" },
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
  show_all: { uz: "Barchasini ko'rish", en: "Show all", ru: "Показать все" },
  total: { uz: "JAMI", en: "TOTAL", ru: "ВСЕГО" },
  manage: { uz: "Boshqarish", en: "Manage", ru: "Управление" },
  stat_my_courses: { uz: "Mening kurslarim", en: "My Courses", ru: "Мои курсы" },
  view_all: { uz: "Barchasini ko'rish", en: "View All", ru: "Смотреть все" },

  // Student dashboard
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

  // Login
  login_title: { uz: "Kirish", en: "Login", ru: "Вход" },
  email_label: { uz: "Email", en: "Email", ru: "Email" },
  password_label: { uz: "Parol", en: "Password", ru: "Пароль" },
  login_button: { uz: "Kirish", en: "Login", ru: "Войти" },
  logging_in: { uz: "Kirilmoqda...", en: "Logging in...", ru: "Вход..." },
  no_account: { uz: "Akkauntingiz yo'qmi?", en: "Don't Have an account?", ru: "Нет аккаунта?" },
  register_link: { uz: "Ro'yxatdan o'tish", en: "Register", ru: "Регистрация" },
  waking_server: {
    uz: "Server uyg'onmoqda, bu bir daqiqagacha vaqt olishi mumkin...",
    en: "Waking up the server, this can take up to a minute on the first request...",
    ru: "Сервер просыпается, это может занять до минуты..."
  },
  slogan: { uz: "Bilimga yangi qadam", en: "A New Step Towards Knowledge", ru: "Новый шаг к знаниям" },

  // Register
  register_title: { uz: "Ro'yxatdan o'tish", en: "Register", ru: "Регистрация" },
  fullname_label: { uz: "To'liq ism", en: "FullName", ru: "Полное имя" },
  password_hint: { uz: "Kamida 8 ta belgi", en: "At least 8 characters", ru: "Минимум 8 символов" },
  secret_code_label: { uz: "Maxfiy kod", en: "Secret Code", ru: "Секретный код" },
  secret_code_hint: { uz: "6 ta belgi", en: "6 characters", ru: "6 символов" },
  course_group_label: { uz: "Kurs / Guruh", en: "Course / Group", ru: "Курс / Группа" },
  no_course_option: { uz: "Kurs tanlanmagan", en: "No course selected", ru: "Курс не выбран" },
  no_courses_hint: {
    uz: "Hozircha kurslar yo'q — ustozingiz hali kurs yaratmagan, kursni tanlamasdan ham ro'yxatdan o'tishingiz mumkin.",
    en: "No courses yet — your teacher hasn't created one, you can register without picking one.",
    ru: "Курсов пока нет — учитель ещё не создал курс, можно зарегистрироваться без выбора."
  },
  registering: { uz: "Ro'yxatdan o'tilmoqda...", en: "Registering...", ru: "Регистрация..." },
  register_button: { uz: "Ro'yxatdan o'tish", en: "Register", ru: "Зарегистрироваться" },
  have_account: { uz: "Akkauntingiz bormi?", en: "Have an account?", ru: "Уже есть аккаунт?" },
  login_link: { uz: "Kirish", en: "Login", ru: "Войти" },

  // Profile
  edit_profile: { uz: "Profilni tahrirlash", en: "Edit Profile", ru: "Редактировать профиль" },
  profile_edit_warning: {
    uz: "Profilni tahrirlash hali backendga ulanmagan — buning uchun API'da PATCH /me endpointi kerak.",
    en: "Profile editing isn't connected to the backend yet — this needs a PATCH /me endpoint on the API.",
    ru: "Редактирование профиля пока не подключено к backend — нужен endpoint PATCH /me."
  },
  confirm_logout_title: { uz: "Chiqishga ishonchingiz komilmi?", en: "Are you sure you want to LogOut?", ru: "Вы уверены, что хотите выйти?" },
  confirm_logout_text: {
    uz: "Tizimdan chiqasiz va qayta kirishingiz kerak bo'ladi.",
    en: "You will be logged out and will need to log in again.",
    ru: "Вы выйдете из системы, и потребуется войти снова."
  },
  yes_logout: { uz: "Ha, chiqish", en: "Yes, LogOut", ru: "Да, выйти" },
  delete_account: { uz: "Akkauntni o'chirish", en: "Delete account", ru: "Удалить аккаунт" },
  delete_account_title: { uz: "Akkaunt butunlay o'chirilsinmi?", en: "Delete your account permanently?", ru: "Удалить аккаунт навсегда?" },
  delete_account_text: { uz: "Bu amalni bekor qilib bo'lmaydi. Barcha ma'lumotlaringiz o'chiriladi.", en: "This action cannot be undone. All your data will be deleted.", ru: "Это действие нельзя отменить. Все ваши данные будут удалены." },
  enter_password_delete: { uz: "Tasdiqlash uchun parolingizni kiriting", en: "Enter your password to confirm", ru: "Введите пароль для подтверждения" },
  confirm_delete: { uz: "Butunlay o'chirish", en: "Delete permanently", ru: "Удалить навсегда" },
  account_deleted: { uz: "Akkaunt o'chirildi", en: "Account deleted", ru: "Аккаунт удалён" },
  student_role: { uz: "O'quvchi", en: "Student", ru: "Ученик" },
  teacher_role: { uz: "Ustoz", en: "Teacher", ru: "Учитель" },

  // Assignment detail (student)
  back_to_dashboard: { uz: "Bosh sahifaga qaytish", en: "Back to Dashboard", ru: "Назад на панель" },
  assignment_not_found: { uz: "Topshiriq topilmadi", en: "Assignment not found", ru: "Задание не найдено" },
  due_label: { uz: "Muddat", en: "Due", ru: "Срок" },
  your_work_label: { uz: "Sizning ishingiz", en: "Your work", ru: "Ваша работа" },
  work_placeholder: {
    uz: "Bajargan topshirig'ingizni shu yerga yozing yoki joylashtiring...",
    en: "Write or paste your completed assignment here...",
    ru: "Напишите или вставьте выполненное задание здесь..."
  },
  submit_assignment_button: { uz: "Topshiriqni yuborish", en: "Submit Assignment", ru: "Отправить задание" },
  edit_submission: { uz: "Tahrirlash", en: "Edit Submission", ru: "Редактировать" },
  not_graded_yet: { uz: "Hali baholanmagan", en: "Not graded yet", ru: "Ещё не оценено" },
  grade_word: { uz: "Baho", en: "Grade", ru: "Оценка" },
  submission_closed: { uz: "Qabul qilish yopilgan", en: "Submission closed", ru: "Приём закрыт" },
  lock_reason_graded: {
    uz: "Bu topshiriq allaqachon baholangan va endi tahrirlab bo'lmaydi.",
    en: "This submission has already been graded and can no longer be edited.",
    ru: "Эта работа уже оценена и больше не может быть изменена."
  },
  lock_reason_deadline: {
    uz: "Muddat o'tib ketgan — bu topshiriqni endi yuborib yoki tahrirlab bo'lmaydi.",
    en: "The deadline has passed — this assignment can no longer be submitted or edited.",
    ru: "Срок истёк — это задание больше нельзя отправить или изменить."
  },
  editing_clears_grade: {
    uz: "Tahrirlash joriy bahoni o'chirib yuboradi — ustozingiz qayta baholashi kerak bo'ladi.",
    en: "Editing will clear your current grade — your teacher will need to re-grade it.",
    ru: "Редактирование сбросит текущую оценку — учителю нужно будет оценить заново."
  },

  // Teacher assignment detail
  assigned_by: { uz: "Bergan ustoz", en: "Assigned by", ru: "Задал учитель" },
  graded_word: { uz: "baholangan", en: "graded", ru: "оценено" },
  no_submissions_yet: {
    uz: "Hech kim bu topshiriqni hali yubormagan.",
    en: "No student has submitted this assignment yet.",
    ru: "Пока никто не отправил это задание."
  },
  save_grade: { uz: "Bahoni saqlash", en: "Save Grade", ru: "Сохранить оценку" },
  edit_grade: { uz: "Bahoni tahrirlash", en: "Edit Grade", ru: "Изменить оценку" },
  feedback_placeholder: {
    uz: "O'quvchi uchun izoh (ixtiyoriy)",
    en: "Feedback for the student (optional)",
    ru: "Комментарий для ученика (необязательно)"
  },

  // Courses
  my_courses: { uz: "Mening kurslarim", en: "My Courses", ru: "Мои курсы" },
  my_courses_subtitle: {
    uz: "Kurslar yarating va ularni topshiriqlarga bog'lang",
    en: "Create courses and link them to assignments",
    ru: "Создавайте курсы и привязывайте к ним задания"
  },
  new_course_label: { uz: "Yangi kurs nomi", en: "New course name", ru: "Название нового курса" },
  new_course_placeholder: { uz: "masalan: 10-A sinf", en: "e.g. Group 10-A", ru: "например: Группа 10-А" },
  create_course: { uz: "Yaratish", en: "Create", ru: "Создать" },
  no_courses_yet: {
    uz: "Hali kurs yaratmagansiz — yuqoridan qo'shing, shunda o'quvchilar ro'yxatdan o'tishda tanlay oladi.",
    en: "You haven't created any courses yet — add one above so students can pick it during registration.",
    ru: "Вы ещё не создали курс — добавьте выше, чтобы ученики могли выбрать его при регистрации."
  },
  students_word: { uz: "o'quvchi", en: "students", ru: "учеников" },
  courses_word: { uz: "ta kurs", en: "courses", ru: "курсов" },
  manage_courses_hint: { uz: "boshqarish uchun bosing", en: "tap to manage", ru: "нажмите для управления" },

  // Notifications
  notifications_title: { uz: "Bildirishnomalar", en: "Notifications", ru: "Уведомления" },
  all_caught_up: { uz: "Hammasi ko'rilgan", en: "You're all caught up", ru: "Всё просмотрено" },

  // Login - hardcoded strings
  login_label: { uz: "Kirish", en: "Login", ru: "Вход" },
  password_placeholder: { uz: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", en: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", ru: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" },

  // Assignment detail - hardcoded strings
  assignment_loading: { uz: "Yuklanmoqda...", en: "Loading...", ru: "Загрузка..." },
  assignment_not_found_msg: { uz: "Topshiriq topilmadi", en: "Assignment not found", ru: "Задание не найдено" },
  back_to_dashboard_btn: { uz: "Bosh sahifaga qaytish", en: "Back to Dashboard", ru: "Назад на панель" },
  due: { uz: "Muddat", en: "Due", ru: "Срок" },
  submitted_label: { uz: "Topshirildi", en: "Submitted", ru: "Отправлено" },
  late_label: { uz: "Kech", en: "Late", ru: "Опоздание" },
  not_graded_msg: { uz: "Hali baholanmagan", en: "Not graded yet", ru: "Ещё не оценено" },
  grade_value: { uz: "Baho", en: "Grade", ru: "Оценка" },
  edit_submission_btn: { uz: "Tahrirlash", en: "Edit Submission", ru: "Редактировать" },
  submit_url_label: { uz: "Ish havolasi", en: "Your work URL", ru: "URL работы" },
  submit_url_placeholder: { uz: "Topshirig'ingiz havolasini kiriting...", en: "Paste a link to your completed assignment...", ru: "Вставьте ссылку на выполненное задание..." },
  submission_closed_label: { uz: "Qabul qilish yopilgan", en: "Submission closed", ru: "Приём закрыт" },

  // Profile - hardcoded strings
  change_password: { uz: "Parolni o'zgartirish", en: "Change Password", ru: "Изменить пароль" },
  current_password: { uz: "Joriy parol", en: "Current Password", ru: "Текущий пароль" },
  new_password: { uz: "Yangi parol", en: "New Password", ru: "Новый пароль" },
  confirm_new_password: { uz: "Yangi parolni tasdiqlash", en: "Confirm New Password", ru: "Подтвердите новый пароль" },
  passwords_no_match: { uz: "Parollar mos kelmayapti", en: "Passwords do not match", ru: "Пароли не совпадают" },
  student_id_label: { uz: "Sizning ID raqamingiz", en: "Your Student ID", ru: "Ваш ID ученика" },
  share_id_hint: { uz: "Ustozingizga shu ID ni bering (harflar va raqamlar bilan), shunda sizni kursga qo'sha oladi.", en: "Share this ID with your teacher (including letters and numbers) so they can add you to a course.", ru: "Поделитесь этим ID с учителем (включая буквы и цифры), чтобы он добавил вас в курс." },

  // Teacher Dashboard - hardcoded strings
  review_label: { uz: "Tekshirish", en: "REVIEW", ru: "ПРОВЕРКА" },
  manage_label: { uz: "Boshqarish", en: "Manage", ru: "Управление" },
  delete_assignment_title: { uz: "Topshiriqni o'chirish", en: "Delete assignment", ru: "Удалить задание" },
  are_you_sure: { uz: "Ishonchingiz komilmi?", en: "Are you sure?", ru: "Вы уверены?" },
  delete_confirm_text: { uz: " va uning topshirilganlari butunlay o'chiriladi.", en: " and its submissions will be permanently deleted.", ru: " и все отправленные работы будут удалены навсегда." },

  // Teacher Grades - hardcoded strings
  all_assignments: { uz: "Barcha topshiriqlar", en: "All assignments", ru: "Все задания" },
  sort_by_name: { uz: "Ism bo'yicha", en: "Sort by name", ru: "По имени" },
  sort_by_grade: { uz: "Baho bo'yicha", en: "Sort by grade", ru: "По оценке" },
  sort_by_date: { uz: "Sana bo'yicha", en: "Sort by latest", ru: "По дате" },
  no_grade_data: { uz: "Baho ma'lumotlari topilmadi", en: "No grade data found", ru: "Данные об оценках не найдены" },
  status_complete: { uz: "Tugallangan", en: "Complete", ru: "Завершено" },
  status_partial: { uz: "Qisman", en: "Partial", ru: "Частично" },
  status_pending: { uz: "Kutilmoqda", en: "Pending", ru: "Ожидает" },
  student_column: { uz: "O'quvchi", en: "Student", ru: "Ученик" },
  submissions_column: { uz: "Topshirmalar", en: "Submissions", ru: "Отправки" },
  graded_column: { uz: "Baholangan", en: "Graded", ru: "Оценено" },
  avg_grade_column: { uz: "O'rt. baho", en: "Avg Grade", ru: "Средняя" },
  status_column: { uz: "Holat", en: "Status", ru: "Статус" },
  submissions_word: { uz: "topshirma", en: "submissions", ru: "отправки" },
  completed_reviews: { uz: "tugallangan tekshiruvlar", en: "completed reviews", ru: "завершённых проверок" },
  awaiting_review: { uz: "tekshirish kutilmoqda", en: "awaiting review", ru: "ожидает проверки" },

  // Teacher Course - hardcoded strings
  save_btn: { uz: "Saqlash", en: "Save", ru: "Сохранить" },
  cancel_btn: { uz: "Bekor qilish", en: "Cancel", ru: "Отмена" },
  admin_badge: { uz: "ADMIN", en: "ADMIN", ru: "АДМИН" },
  group_evening_hint: { uz: "masalan: Kechki guruhi", en: "e.g. Weekday evening group", ru: "например: Вечерняя группа" },
  add_student: { uz: "O'quvchi qo'shish", en: "Add student", ru: "Добавить ученика" },
  add_btn: { uz: "Qo'shish", en: "Add", ru: "Добавить" },

  // Assignment detail - student
  no_deadline_set: { uz: "Muddat belgilanmagan", en: "No deadline set", ru: "Срок не установлен" },
  overdue_by: { uz: (val) => `${val} dan ortiq kechikdi`, en: (val) => `Overdue by ${val}`, ru: (val) => `Опоздание на ${val}` },
  days_left: { uz: (val) => `${val} kun qoldi`, en: (val) => `${val} days left`, ru: (val) => `Осталось ${val} дн.` },
  due_in: { uz: (val) => `${val} daqiqa qoldi`, en: (val) => `Due in ${val}`, ru: (val) => `Осталось ${val} мин.` },
  due_tomorrow: { uz: "Ertaga", en: "Due tomorrow", ru: "Срок завтра" },

  // Student Dashboard - hardcoded strings
  not_in_course: { uz: "Siz hali kursda emassiz", en: "You're not in a course yet", ru: "Вы ещё не в курсе" },
  share_id_with_teacher: { uz: "O'zingizning ID raqamingizni (profilngizdagi) ustozingizga bering, shunda sizni kursga qo'sha oladi.", en: "Give your teacher your Student ID (on your profile) so they can add you.", ru: "Передайте учителю свой ID (в профиле), чтобы он добавил вас в курс." },
  view_id: { uz: "ID ko'rish \u2192", en: "View ID \u2192", ru: "Посмотреть ID \u2192" },

  // Student Rating - hardcoded strings
  your_rank_label: { uz: "Sizning o'rningiz", en: "Your rank", ru: "Ваше место" },

  // Teacher Lessons - hardcoded strings

  // Teacher Students - hardcoded strings
  pts_label: { uz: "ball", en: "pts", ru: "балл" },

  // Student Grades - hardcoded strings
  submissions_word_short: { uz: "topshirma", en: "submissions", ru: "отправок" },
  completed_word: { uz: "tugallangan", en: "completed", ru: "завершено" },
  avg_grade_word: { uz: "o'rt. baho", en: "avg grade", ru: "средняя" },
  awaiting_review_word: { uz: "tekshirish kutilmoqda", en: "awaiting review", ru: "ожидает проверки" },
  all_grades: { uz: "Barcha baholar", en: "All Grades", ru: "Все оценки" },
  no_grades_yet: { uz: "Hali baholar yo'q", en: "No grades available yet", ru: "Оценок пока нет" },
  submitted_at_label: { uz: "Topshirilgan:", en: "Submitted:", ru: "Отправлено:" },
  pending_word: { uz: "Kutilmoqda", en: "Pending", ru: "Ожидает" },
  grades_across: { uz: "Barcha topshiriqlardagi baholaringiz.", en: "Your grades across all assignments.", ru: "Ваши оценки по всем заданиям." },
  view_manage_grades: { uz: "Barcha o'quvchilarning baholarini ko'ring va boshqaring.", en: "View and manage all student grades across assignments.", ru: "Просматривайте и управляйте оценками всех учеников." },

  // Lesson activity materials (non-gradable) + shared strings
  open_link: { uz: "Havolani ochish", en: "Open link", ru: "Открыть ссылку" },
  view_details: { uz: "Batafsil", en: "View details", ru: "Подробнее" },
  materials_hint: { uz: "O'quv materiallari — topshirish talab qilinmaydi.", en: "Study materials — no submission required.", ru: "Учебные материалы — сдавать не нужно." },
  error_updating_assignment: { uz: "Topshiriqni yangilashda xatolik", en: "Error updating assignment", ru: "Ошибка обновления задания" },

  // Teacher rating page
  teacher_rating_title: { uz: "O'quvchilar reytingi", en: "Student Ranking", ru: "Рейтинг учеников" },
  teacher_rating_subtitle: { uz: "Uy ishlari va davomat ballari bo'yicha eng faol o'quvchilar.", en: "Most active students by homework grades and attendance points.", ru: "Самые активные ученики по оценкам и посещаемости." },
  teacher_rating_count: { uz: (count) => `${count} ta o'quvchi`, en: (count) => `${count} students`, ru: (count) => `${count} учеников` },
  teacher_rating_homework: { uz: "Uy ishi", en: "Homework", ru: "Домашка" },
  teacher_rating_attendance: { uz: "Davomat", en: "Attendance", ru: "Посещение" },
  teacher_rating_all_in_podium: { uz: "Barcha o'quvchilar TOP-3 da.", en: "All students are in the TOP-3.", ru: "Все ученики в ТОП-3." },

  // Archive
  nav_archive: { uz: "Arxiv", en: "Archive", ru: "Архив" },
  archive_title: { uz: "Arxiv", en: "Archive", ru: "Архив" },
  archive_tab_assignments: { uz: "Topshiriqlar", en: "Assignments", ru: "Задания" },
  archive_tab_lessons: { uz: "Darslar", en: "Lessons", ru: "Уроки" },
  archive_assignments_count: { uz: (n) => `${n} ta topshiriq`, en: (n) => `${n} assignments`, ru: (n) => `${n} заданий` },
  archive_subs_count: { uz: (n) => `${n} topshirildi`, en: (n) => `${n} submitted`, ru: (n) => `${n} сдано` },
  archive_panel_title: { uz: "Haftalik hisobot", en: "Weekly report", ru: "Недельный отчет" },
  archive_panel_hint: { uz: "Arxivlangan topshiriqlar — barchasi arxivda saqlangan", en: "Archived assignments — everything is kept in the archive", ru: "Архивированные задания — всё хранится в архиве" },
  archive_mode_toggle: { uz: "Arxiv rejimi", en: "Archive mode", ru: "Режим архива" },
  archived_count: { uz: (n) => `${n} arxivda`, en: (n) => `${n} archived`, ru: (n) => `${n} в архиве` },
  weekly_report_title: { uz: "Haftalar bo'yicha hisobot", en: "Report by week", ru: "Отчет по неделям" },
  weekly_report_assignments: { uz: (n) => `${n} ta topshiriq`, en: (n) => `${n} assignments`, ru: (n) => `${n} заданий` },
  weekly_report_subs: { uz: (n) => `${n} topshirish`, en: (n) => `${n} submissions`, ru: (n) => `${n} сдач` },
  weekly_report_ungraded: { uz: (n) => `${n} baholanmagan`, en: (n) => `${n} ungraded`, ru: (n) => `${n} не оценено` },
  weekly_report_quiz_avg: { uz: (n) => `o'rtacha ${n}`, en: (n) => `avg ${n}`, ru: (n) => `сред. ${n}` },
  archive_subtitle: { uz: "Tugagan haftalarning darslari va topshiriqlari bu yerda saqlanadi.", en: "Lessons and assignments from finished weeks are stored here.", ru: "Уроки и задания завершённых недель хранятся здесь." },
  archive_empty: { uz: "Arxiv bo'sh — hozirgi haftadagi darslar tugagach, bu yerda paydo bo'ladi.", en: "Archive is empty — lessons from finished weeks will appear here.", ru: "Архив пуст — уроки завершённых недель появятся здесь." },
  archive_week_label: { uz: "Hafta", en: "Week", ru: "Неделя" },
  archive_restore: { uz: "Tiklash", en: "Restore", ru: "Восстановить" },
  archive_restored: { uz: "Arxivdan tiklandi", en: "Restored from archive", ru: "Восстановлено из архива" },
  archive_current_week: { uz: "Joriy hafta", en: "Current week", ru: "Текущая неделя" },
  archive_lessons_count: { uz: (count) => `${count} ta dars`, en: (count) => `${count} lessons`, ru: (count) => `${count} уроков` },
  archive_activities_count: { uz: (count) => `${count} ta topshiriq`, en: (count) => `${count} assignments`, ru: (count) => `${count} заданий` },
  error_deleting_activity: { uz: "Faoliyatni o'chirishda xatolik", en: "Error deleting activity", ru: "Ошибка удаления задания" },
  assignment_updated: { uz: "Topshiriq yangilandi", en: "Assignment updated", ru: "Задание обновлено" },
  could_not_delete: { uz: "O'chirib bo'lmadi — element serverda mavjud emas bo'lishi mumkin", en: "Could not delete — the item may not exist on the server", ru: "Не удалось удалить — возможно, элемент не существует" },
  // Analytics / charts
  analytics_title: { uz: "Statistika", en: "Analytics", ru: "Статистика" },
  analytics_subtitle: { uz: "Sinflaringizning jonli ko'rsatkichlari", en: "Live metrics across your classes", ru: "Живые показатели ваших классов" },
  avg_grade_by_course: { uz: "Fanlar bo'yicha o'rtacha baho", en: "Average grade by course", ru: "Средняя оценка по предметам" },
  submission_status: { uz: "Tekshirish holati", en: "Review status", ru: "Статус проверки" },
  graded_word: { uz: "Tekshirilgan", en: "Graded", ru: "Проверено" },
  awaiting_grade: { uz: "Tekshirilmoqda", en: "Awaiting grade", ru: "Ожидает проверки" },
  grade_trend: { uz: "Baho dinamikasi", en: "Grade trend", ru: "Динамика оценок" },
  grade_distribution: { uz: "Baholar taqsimoti", en: "Grade distribution", ru: "Распределение оценок" },
  students_word: { uz: "o'quvchi", en: "student", ru: "ученик" },
  chart_empty: { uz: "Hozircha ma'lumot yo'q", en: "No data yet", ru: "Пока нет данных" },
  avg_word: { uz: "o'rtacha", en: "average", ru: "средняя" },
}

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'uz')

  const changeLang = (code) => {
    if (!LANGUAGES.includes(code)) return
    setLang(code)
    localStorage.setItem('app_lang', code)
  }

  // t('key') for plain strings, t('key', arg1, arg2) for the few function-based ones
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