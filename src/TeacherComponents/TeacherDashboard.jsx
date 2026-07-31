import { useState, useEffect } from "react"
import IconsBg from "../SmallComponents/IconsBg"
import { MdAssignment, MdPendingActions } from "react-icons/md"
import { BiSend, BiCalendar } from "react-icons/bi"
import { BsPeople } from "react-icons/bs"
import { IoCreate, IoChevronForward } from "react-icons/io5"
import { FiTrash2 } from "react-icons/fi"
import axios from "axios"
import { toast } from "react-toastify"
import { CgSpinner } from "react-icons/cg"

const TeacherDashboard = () => {
  const [assignment, setAssignment] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [assignmentsList, setAssignmentsList] = useState([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchAssignments()
  }, [])

  const handleDelete = async (id) => {
    try {
      setLoading(true)
      await axios.delete(`https://6a61aaafda10c59c1809b130.mockapi.io/assignment/${id}`)
      setAssignmentsList((prev) => prev.filter((item) => item.id !== id))
      toast.success('Successfully Deleted')
    } catch (error) {
      toast.error('Error when Deleting')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const res = await axios.get('https://6a61aaafda10c59c1809b130.mockapi.io/assignment')
      setAssignmentsList(res.data)
    } catch (error) {
      console.error("Ma'lumotlarni olishda xatolik", error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!assignment.trim()) return

    const newData = {
      assignment: assignment,
      deadline: deadline
    }

    try {
      setLoading(true)
      const res = await axios.post('https://6a61aaafda10c59c1809b130.mockapi.io/assignment', newData)
      setAssignmentsList((prev) => [...prev, res.data])
      setAssignment('')
      setDeadline('')
      toast.success('Successfully Uploaded')
    } catch (error) {
      toast.error('Error when uploading')      
    } finally {
      setLoading(false)
    }
  }

  const displayedAssignments = showAll ? assignmentsList : assignmentsList.slice(0, 3)

  return (
    <div className="relative w-full min-h-screen bg-[#03071e] pb-20">
      <IconsBg />
      <div className="relative z-10 p-10 flex flex-col">
        <div className="flex flex-col gap-2">
          <h1 className="font-bold text-white text-6xl">Hello, Teacher</h1>
          <h1 className="font-bold text-indigo-300 text-xl">Keep track of today's learning process and assignment status.</h1>
        </div>

        <div className="flex flex-wrap gap-10 pt-10 justify-between">
          <div className="w-96 h-44 hover:scale-102 hover:shadow-2xl rounded-2xl shadow-lg shadow-indigo-900 transition-all duration-200 ease-in-out p-7 bg-[#08133d]">
            <div className="flex justify-between">
              <MdAssignment className="text-indigo-400 text-3xl" />
              <h1 className="text-indigo-400 text-sm font-serif">Total</h1>
            </div>
            <h1 className="text-4xl text-white pt-3">12</h1>
            <h1 className="text-indigo-400 text-sm pt-2 font-bold">Submitted assignments</h1>
          </div>

          <div className="w-96 h-44 hover:scale-102 hover:shadow-2xl rounded-2xl shadow-lg shadow-indigo-900 transition-all duration-200 ease-in-out p-7 bg-[#08133d]">
            <div className="flex justify-between">
              <MdPendingActions className="text-indigo-400 text-3xl" />
              <h1 className="text-indigo-400 text-sm font-serif">Pending</h1>
            </div>
            <h1 className="text-4xl text-white pt-3">45</h1>
            <h1 className="text-indigo-400 text-sm pt-2 font-bold">To be graded</h1>
          </div>

          <div className="w-96 h-44 hover:scale-102 hover:shadow-2xl rounded-2xl shadow-lg shadow-indigo-900 transition-all duration-200 ease-in-out p-7 bg-[#08133d]">
            <div className="flex justify-between">
              <BsPeople className="text-indigo-400 text-3xl" />
              <h1 className="text-indigo-400 text-sm font-serif">Total</h1>
            </div>
            <h1 className="text-4xl text-white pt-3">12</h1>
            <h1 className="text-indigo-400 text-sm pt-2 font-bold">Students</h1>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-10 mt-10 items-start">
          
          <form onSubmit={handleSubmit} className="bg-[#08133d] rounded-2xl p-8 flex flex-col gap-6 w-full xl:w-[400px] shrink-0">
            <div className="text-white flex gap-2 items-center">
              <IoCreate className="text-3xl"/>
              <h1 className="text-2xl font-semibold">Create Assignment</h1>
            </div>
            <div className="flex flex-col text-white gap-1">
              <label htmlFor="topicName">Topic Name</label>
              <input 
                value={assignment}
                required
                onChange={(e)=> setAssignment(e.target.value)}
                className="rounded-xl p-3 w-full outline-none focus:shadow-md transition-all duration-150 ease-in-out focus:shadow-blue-800 bg-[#090b79]" 
                type="text" 
                id="topicName" 
                placeholder="Enter the topic name" 
              />
            </div>
            <div className="flex flex-col text-white gap-1">
              <label htmlFor="deadline">Deadline</label>
              <input
                value={deadline}
                onChange={(e)=>setDeadline(e.target.value)}
                className="rounded-xl p-3 w-full outline-none focus:shadow-md transition-all duration-150 ease-in-out focus:shadow-blue-800 bg-[#090b79] [&::-webkit-calendar-picker-indicator]:invert" 
                type="date" 
                id="deadline" 
              />
            </div>
            <button
              disabled={loading}
              className="text-black border-none cursor-pointer hover:shadow-lg hover:shadow-[#78af1f] transition-all duration-150 ease-in-out bg-[#8fd125] flex p-3 justify-center items-center gap-1 rounded-xl font-medium">
              {loading ? <CgSpinner className="animate-spin text-xl"/> : <span className="flex items-center gap-1">Submit <BiSend className="text-xl"/></span>}
            </button>
          </form>

         <div className="flex flex-col gap-5 flex-1 w-full">
            <div className="flex justify-between items-center text-white px-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-green-400">⚡</span> Submitted Assignments
              </h2>
              <span className="text-indigo-300 font-semibold text-sm">TOTAL: {assignmentsList.length}</span>
            </div>

              {
                assignmentsList.length === 0 ? <h1 className="text-slate-400 text-center pt-28 text-2xl">No Assignments Yet</h1> :
                            loading && assignmentsList.length === 0 ? <h1 className="text-2xl text-white text-center pt-28">Loading...</h1> :
            (
              <div className="flex flex-col gap-4">
                <div 
                  id="assignmentContainer" 
                  className={`flex flex-col gap-4 transition-all duration-300 ${showAll ? 'max-h-[460px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
                  
                  {displayedAssignments.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="relative bg-[#08133d] border border-indigo-900/50 p-6 rounded-2xl flex items-center justify-between shadow-xl shrink-0 overflow-hidden hover:border-indigo-500/50 transition-all">
                      
                      <div className={`absolute left-0 top-0 bottom-0 w-2 ${index % 2 === 0 ? 'bg-gradient-to-b from-blue-500 to-indigo-600' : 'bg-gradient-to-b from-purple-500 to-pink-600'}`} />

                      <div className="flex flex-col gap-2 pl-2">
                        <h3 className="text-white font-bold text-lg">{item.assignment}</h3>
                        <div className="flex items-center gap-2 text-indigo-300 text-sm">
                          <BiCalendar className="text-lg text-indigo-400" />
                          <span>{item.deadline || "Belgilanmagan"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] tracking-wider text-indigo-400 font-semibold">SUBMITTED</span>
                          <div className="flex items-center gap-2 text-white font-bold">
                            <span>0 / 24</span>
                            <div className="w-12 h-1.5 bg-indigo-950 rounded-full overflow-hidden">
                              <div className="w-0 h-full bg-green-500"></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="w-10 h-10 rounded-xl bg-red-950/40 hover:bg-red-600 transition-all flex items-center justify-center text-red-400 hover:text-white shadow-md cursor-pointer"
                            title="Delete assignment">
                            <FiTrash2 className="text-lg" />
                          </button>

                          <button className="w-10 h-10 rounded-xl bg-[#0e1b52] hover:bg-indigo-600 transition-all flex items-center justify-center text-white shadow-md cursor-pointer">
                            <IoChevronForward className="text-lg" />
                          </button>
                        </div>

                      </div>

                    </div>
                  ))}
                </div>

                {assignmentsList.length > 3 && (
                  <button 
                    onClick={() => setShowAll(!showAll)}
                    className="self-center mt-2 px-6 py-2.5 rounded-xl bg-[#08133d] border border-indigo-900 text-indigo-300 hover:text-white hover:border-indigo-500 transition-all font-semibold text-sm cursor-pointer shadow-md">
                    {showAll ? "Show Less" : `View All (${assignmentsList.length})`}
                  </button>
                )}
              </div>
            )}
              

         </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard