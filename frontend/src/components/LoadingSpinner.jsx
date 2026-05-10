export default function LoadingSpinner({ size }) {
  return (
    <div className="flex w-full justify-center">
      <div className={`p-${size} border-10 border-surface rounded-full border-t-accent animate-spin`}></div>
    </div>
  )
}