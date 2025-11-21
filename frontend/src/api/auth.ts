import request from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
  realName: string
  email: string
}

export const authApi = {
  login: (data: LoginParams) => {
    return request.post('/auth/login', data)
  },
  
  register: (data: RegisterParams) => {
    // Transform camelCase to snake_case for backend
    return request.post('/auth/register', {
      username: data.username,
      password: data.password,
      real_name: data.realName,
      email: data.email
    })
  },
  
  getProfile: () => {
    return request.get('/auth/profile')
  }
}
