import React, { useState } from 'react'
import "../auth.form.scss"
import { Link, useNavigate } from "react-router"
import { useAuth } from '../hooks/useAuth'


function Login() {

    const navigate = useNavigate()
    const { loading, handleLogin } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [errorMessage, setErrorMessage] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("")

        const result = await handleLogin({email, password})

        if(result.success){
            navigate("/")
            return
        }

        setErrorMessage(result.message)
    }

    if(loading){
        return (<main>Loading...</main>)
    }
  return (
    <main>
        
            <div className="form-container">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
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

                    <button className='button primary-button'>Login</button>
                </form>

                {errorMessage ? <p>{errorMessage}</p> : null}

                <p>Don't have an account? <Link to={"/register"}>Register</Link></p>
            </div>
        
    </main>
  )
}

export default Login
