import LoginForm from './login-form'

export default function AuthModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full px-4">
        <LoginForm />
      </div>
    </div>
  )
}
