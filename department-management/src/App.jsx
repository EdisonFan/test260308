import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [departments, setDepartments] = useState([
    { id: 1, name: '技术部', manager: '张三', employees: 20 },
    { id: 2, name: '市场部', manager: '李四', employees: 15 },
    { id: 3, name: '人事部', manager: '王五', employees: 5 },
  ])
  
  const [editingDept, setEditingDept] = useState(null)
  const [formData, setFormData] = useState({ name: '', manager: '', employees: 0 })
  const [mainAppMessage, setMainAppMessage] = useState('')

  // 监听来自主应用的消息
  useEffect(() => {
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
        message: `来自部门管理应用！我们有 ${departments.length} 个部门。`
      })
    }
  }

  const handleEdit = (dept) => {
    setEditingDept(dept)
    setFormData(dept)
  }

  const handleDelete = (deptId) => {
    setDepartments(departments.filter(dept => dept.id !== deptId))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingDept) {
      setDepartments(departments.map(dept => 
        dept.id === editingDept.id ? { ...formData, id: editingDept.id } : dept
      ))
    } else {
      setDepartments([...departments, { ...formData, id: departments.length + 1 }])
    }
    setEditingDept(null)
    setFormData({ name: '', manager: '', employees: 0 })
  }

  const handleCancel = () => {
    setEditingDept(null)
    setFormData({ name: '', manager: '', employees: 0 })
  }

  return (
    <div className="app-container">
      <h1>部门管理</h1>
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
        <h2>{editingDept ? '编辑部门' : '添加部门'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>部门名称:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>部门经理:</label>
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>员工数量:</label>
            <input
              type="number"
              value={formData.employees}
              onChange={(e) => setFormData({ ...formData, employees: parseInt(e.target.value) || 0 })}
              required
              min="0"
            />
          </div>
          <div className="form-actions">
            <button type="submit">{editingDept ? '更新' : '添加'}</button>
            {editingDept && <button type="button" onClick={handleCancel}>取消</button>}
          </div>
        </form>
      </div>

      <div className="table-container">
        <h2>部门列表</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>部门名称</th>
              <th>部门经理</th>
              <th>员工数量</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(dept => (
              <tr key={dept.id}>
                <td>{dept.id}</td>
                <td>{dept.name}</td>
                <td>{dept.manager}</td>
                <td>{dept.employees}</td>
                <td className="actions">
                  <button onClick={() => handleEdit(dept)}>编辑</button>
                  <button onClick={() => handleDelete(dept.id)}>删除</button>
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
