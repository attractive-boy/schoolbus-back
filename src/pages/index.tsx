// pages/index.tsx
'use client';
import React, { useState } from 'react';
import { post } from '@/services/request';
import { message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const HomePage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await post<{ token: string }>('/login', {
        username,
        password
      }, {
        showSuccess: true,
        successMsg: '登录成功'
      });
      
      localStorage.setItem('token', res.token);
      window.location.href = '/bus';
    } catch (error) {
      // 错误已经被请求服务处理，这里不需要额外处理
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(120deg, #2980b9, #8e44ad)'
    }}>
      <div style={{
        width: '400px',
        padding: '40px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '10px',
        boxShadow: '0 15px 25px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            fontSize: '24px',
            color: '#333',
            margin: 0
          }}>滨实接送服务管理系统</h1>
        </div>
        
        <form onSubmit={handleLogin} style={{marginBottom: '20px'}}>
          <div style={{
            position: 'relative',
            marginBottom: '20px'
          }}>
            <UserOutlined style={{
              position: 'absolute',
              left: '12px',
              top: '12px',
              color: '#666'
            }} />
            <input
              type="text"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 20px 12px 40px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              required
            />
          </div>

          <div style={{
            position: 'relative',
            marginBottom: '25px'
          }}>
            <LockOutlined style={{
              position: 'absolute',
              left: '12px',
              top: '12px',
              color: '#666'
            }} />
            <input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 20px 12px 40px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              required
            />
          </div>

          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2980b9',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2471a3'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2980b9'}
          >
            登 录
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '12px'
        }}>
          <p>滨实接送服务 © {new Date().getFullYear()} All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
