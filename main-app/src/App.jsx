import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import microApp from '@micro-zoe/micro-app'

function App() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('主应用发来问候！')
  const [activeApp, setActiveApp] = useState('user-management')
  
  const menuItems = [
    { name: 'user-management', label: '用户管理', url: 'http://localhost:4000/' },
    { name: 'department-management', label: '部门管理', url: 'http://localhost:4001/' },
    { name: 'settings', label: '系统设置', url: 'http://localhost:4002/' },
  ]

  // Send data to sub-app
  const sendMessageToSubApp = () => {
    microApp.setData(activeApp, { type: 'greeting', message: message })
  }

  // Listen for messages from sub-app
  useEffect(() => {
    const callback = (data) => {
      console.log('从子应用接收:', data)
      alert(`子应用说: ${data.message}`)
    }
    
    microApp.addDataListener(activeApp, callback)
    
    return () => {
      microApp.clearDataListener(activeApp, callback)
    }
  }, [activeApp])

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 侧边菜单 */}
      <div style={{ width: '200px', backgroundColor: '#2c3e50', color: 'white', padding: '20px' }}>
        <h2 style={{ marginBottom: '30px' }}>中台系统</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {menuItems.map(item => (
            <button
              key={item.name}
              onClick={() => setActiveApp(item.name)}
              style={{ 
                padding: '10px', 
                backgroundColor: activeApp === item.name ? '#3498db' : '#34495e', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 主内容区 */}
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入要发送给子应用的消息"
            style={{ marginRight: '10px', padding: '8px', width: '300px' }}
          />
          <button onClick={sendMessageToSubApp} style={{ padding: '8px 16px' }}>
            发送消息到子应用
          </button>
        </div>
        
        {/* 动态加载子应用 */}
        {menuItems.map(item => (
          <micro-app 
            key={item.name}
            name={item.name} 
            url={item.url} 
            style={{ display: activeApp === item.name ? 'block' : 'none' }}
          ></micro-app>
        ))}
      </div>
    </div>
  )
}

export default App
