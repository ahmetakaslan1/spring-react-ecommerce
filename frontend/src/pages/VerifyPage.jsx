import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import * as api from '../api'

export default function VerifyPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Geçersiz bağlantı.')
      return
    }

    // Call the verify endpoint
    api.verifyEmail(token)
      .then((res) => {
        setStatus('success')
        setMessage(res || 'E-posta adresiniz başarıyla doğrulandı!')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'Doğrulama başarısız.')
      })
  }, [token])

  return (
    <div className="page" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
      <div className="empty-state" style={{background: 'rgba(10,12,16,0.8)', padding: '40px', borderRadius: '12px', border: '1px solid var(--primary)'}}>
        {status === 'loading' && (
          <>
            <div className="spinner" style={{margin:'0 auto 20px'}}></div>
            <h3>Doğrulanıyor...</h3>
            <p className="text-muted">Lütfen bekleyin.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <i className="fas fa-check-circle" style={{fontSize: '4rem', color: '#00ff00', marginBottom: '20px'}}></i>
            <h3 style={{color: '#00ff00'}}>Başarılı!</h3>
            <p>{message}</p>
            <Link to="/" className="btn btn-primary" style={{marginTop: '20px'}}>Ana Sayfaya Dön</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <i className="fas fa-times-circle" style={{fontSize: '4rem', color: '#ff0000', marginBottom: '20px'}}></i>
            <h3 style={{color: '#ff0000'}}>Hata</h3>
            <p>{message}</p>
            <Link to="/" className="btn btn-primary" style={{marginTop: '20px'}}>Ana Sayfaya Dön</Link>
          </>
        )}
      </div>
    </div>
  )
}
