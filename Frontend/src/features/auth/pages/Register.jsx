import React, { useState } from 'react'
import {useNavigate, Link} from "react-router"
import {useAuth} from '../hooks/useAuth'

function Register() {

    const navigate = useNavigate()

    // 2 way binding
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [errorMessage, setErrorMessage] = useState("")

    const{loading, handleRegister} = useAuth()

    const handleSubmit = async(e) => {
        e.preventDefault()
        setErrorMessage("")

        const result = await handleRegister({username,email, password})

        if(result.success){
            navigate('/')
            return
        }

        setErrorMessage(result.message)
    }

    if(loading){
        return (<main><h1>Loading...</h1></main>)
    }
    
  return (
    <div>
        <main>
        
            <div className="form-container">
                <h1>Register</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input 
                        onChange={(e) => {setUsername(e.target.value)}}
                            type="text" 
                            id="username" 
                            name='username' 
                            placeholder='Enter Username'
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input 
                        onChange={(e) => {setEmail(e.target.value)}}
                            type="text" 
                            id="email" 
                            name='email' 
                            placeholder='Enter email address'
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input 
                        onChange={(e) => {setPassword(e.target.value)}}
                            type="text" 
                            id="password" 
                            name='password' 
                            placeholder='Enter Password'
                        />
                    </div>

                    <button className='button primary-button'>Register</button>
                </form>

                {errorMessage ? <p>{errorMessage}</p> : null}

                <p>Already have an account? <Link to={"/login"}>Login</Link></p>
            </div>
        
    </main>
    </div>
  )
}

export default Register
