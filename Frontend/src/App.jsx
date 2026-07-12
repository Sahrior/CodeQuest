import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Navbar from './component/Navbar'


import Home from './pages/Home'
import Apply from './pages/Apply'
import Community from './pages/Community'
import Compete from './pages/Compete'
import Practice from './pages/Practice'
import Prepare from './pages/Prepare'
import Play from './pages/Play'

const App = () => {
  return (
    <div>

      <Navbar/>

      <Routes>
        <Route path='/' element={ <Home/> } />
        <Route path='/apply' element={ <Apply/> } />
        <Route path='/community' element={ <Community/> } />
        <Route path='/compete' element={ <Compete/> } />
        <Route path='/practice' element={ <Practice/> } />
        <Route path='/prepare' element = { <Prepare/> } />
        <Route path='/play' element = { <Play/> } />
      </Routes>
      
    </div>
  )
}

export default App
