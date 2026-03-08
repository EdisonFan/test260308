import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [users, setUsers] = useState([
    { id: 1, name: '张三', email: 'zhangsan@example.com', role: '管理员' },
    { id: 2, name: '李四', email: 'lisi@example.com', role: '普通用户' },
    { id: 3, name: '王五', email: 'wangwu@example.com', role: '普通用户' },
  ])
  
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', role: '普通用户' })
  const [mainAppMessage, setMainAppMessage] = useState('')

  // 监听来自主应用的消息
  useEffect(() => {
    // 微应用环境
    if (window.__MICRO_APP_ENVIRONMENT__) {
      window.microApp.addDataListener((data) => {
        console.log('从主应用接收:', data)
        setMainAppMessage(data.message)
      })
    }
  }, [])

  // 发送消息到主应用
  const sendMessageToMainApp = () => {
    if (window.__MICRO_APP_ENVIRONMENT__) {
      window.microApp.dispatch({
        type: 'response',
        message: `来自用户管理应用！我们有 ${users.length} 个用户。`
      })
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData(user)
  }

  const handleDelete = (userId) => {
    setUsers(users.filter(user => user.id !== userId))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingUser) {
      setUsers(users.map(user => 
        user.id === editingUser.id ? { ...formData, id: editingUser.id } : user
      ))
    } else {
      setUsers([...users, { ...formData, id: users.length + 1 }])
    }
    setEditingUser(null)
    setFormData({ name: '', email: '', role: '普通用户' })
  }

  const handleCancel = () => {
    setEditingUser(null)
    setFormData({ name: '', email: '', role: '普通用户' })
  }

  return (
    <div className="app-container">
      <h1>用户管理</h1>
      {mainAppMessage && (
        <div style={{ backgroundColor: '#e3f2fd', padding: '10px', marginBottom: '20px', borderRadius: '4px' }}>
          <strong>Message from main app:</strong> {mainAppMessage}
        </div>
      )}
      <button 
        onClick={sendMessageToMainApp}
        style={{ marginBottom: '20px', padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        发送消息到主应用
      </button>
      
      <div className="form-container">
        <h2>{editingUser ? '编辑用户' : '添加用户'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>姓名:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>邮箱:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>角色:</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="普通用户">普通用户</option>
              <option value="管理员">管理员</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit">{editingUser ? '更新' : '添加'}</button>
            {editingUser && <button type="button" onClick={handleCancel}>取消</button>}
          </div>
        </form>
      </div>

      <div className="table-container">
        <h2>用户列表</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td className="actions">
                  <button onClick={() => handleEdit(user)}>编辑</button>
                  <button onClick={() => handleDelete(user.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
