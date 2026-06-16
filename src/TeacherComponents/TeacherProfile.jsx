import React, { useState } from 'react'
import IconsBg from '../SmallComponents/IconsBg'
import { IconCrown, IconLogout, IconMail, IconPencil, IconShieldCheck, IconUser } from '@tabler/icons-react';
import ProfileCard from '../SmallComponents/ProfileCard';

const TeacherProfile = ({setIsAuth}) => {
     
  return (
    <div className='relative p-10'>
        <IconsBg/>
      <ProfileCard setIsAuth={setIsAuth}/>
    </div>
  )
}

export default TeacherProfile
