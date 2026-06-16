import { useState } from 'react';

const RoleToggle = ({ activeRole, onChange }) => {
  return (
    <div className="flex bg-[#030712] p-1.5 rounded-xl border border-slate-800 w-full max-w-[400px]">
      
   
      <button
        type="button"
        onClick={() => onChange('student')}
        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
          activeRole === 'student'
            ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20'
            : 'text-slate-400 hover:text-white bg-transparent'
        }`}
      >
        Student
      </button>


      <button
        type="button"
        onClick={() => onChange('teacher')}
        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
          activeRole === 'teacher'
            ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20'
            : 'text-slate-400 hover:text-white bg-transparent'
        }`}
      >
        Teacher
      </button>

    </div>
  );
};

export default RoleToggle;