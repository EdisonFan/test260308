import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'zh-CN',
    notifications: true,
    autoSave: true,
  })
  
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
        message: `来自系统设置应用！当前主题: ${settings.theme}, 语言: ${settings.language}`
      })
    }
  }

  const handleSettingChange = (key, value) => {
    setSettings({ ...settings, [key]: value })
  }

  return (
    <div className="app-container">
      <h1>系统设置</h1>
      {mainAppMessage && (
        <div style={{ backgroundColor: '#e3f2fd', padding: '10px', marginBottom: '20px', borderRadius: '4px' }}>
          <strong>Message from main app:</strong> {mainAppMessage}
        </div>
      )}
      <button 
        onClick={sendMessageToMainApp}
        style={{ marginBottom: '20px', padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        发送设置到主应用
      </button>
      
      <div className="settings-container">
        <div className="setting-item">
          <label>主题:</label>
          <div>
            <label style={{ marginRight: '20px' }}>
              <input
                type="radio"
                value="light"
                checked={settings.theme === 'light'}
                onChange={() => handleSettingChange('theme', 'light')}
              />
              亮色
            </label>
            <label>
              <input
                type="radio"
                value="dark"
                checked={settings.theme === 'dark'}
                onChange={() => handleSettingChange('theme', 'dark')}
              />
              暗色
            </label>
          </div>
        </div>
        
        <div className="setting-item">
          <label>语言:</label>
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange('language', e.target.value)}
          >
            <option value="zh-CN">中文</option>
            <option value="en-US">English</option>
          </select>
        </div>
        
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => handleSettingChange('notifications', e.target.checked)}
            />
            启用通知
          </label>
        </div>
        
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
            />
            自动保存
          </label>
        </div>
      </div>
    </div>
  )
}

export default App
