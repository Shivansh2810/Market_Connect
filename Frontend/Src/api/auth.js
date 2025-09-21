import axios from 'axios'

const backend_url = "http://localhost:8080/api";

// sending data to backend and receiving res which is sent to respective handler

export const loginUser = async (email,password,role) => {
    try{
        const res = await axios.post(`${backend_url}/login`, {email,password,role});
        return res.data;
    }catch(err){
        throw err.response?.data || {message: "server error"};
    }
};

export const signupUser = async (name,email,password,role) => {
    try{
        const res = await axios.post(`${backend_url}/signup`, {name,email,password,role});
    }catch(err){
        throw err.response?.data || {message: "server error"};
    }
}
