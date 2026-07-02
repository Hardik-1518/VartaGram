import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ hasError: false, error: null })
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center'>
          <div className='max-w-xl rounded-3xl border border-red-200 bg-white p-8 shadow-lg'>
            <h1 className='text-2xl font-semibold text-slate-900'>Something went wrong</h1>
            <p className='mt-3 text-slate-600'>We encountered an unexpected error while rendering this page.</p>
            <p className='mt-2 text-sm text-slate-500'>{this.state.error?.message || 'Please try again.'}</p>
            <button
              type='button'
              onClick={this.handleReset}
              className='mt-6 rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400'
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
