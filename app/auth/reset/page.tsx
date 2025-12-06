import { Suspense } from 'react'
import ResetForm from './ResetForm'

export default function ResetPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetForm />
    </Suspense>
  )
}
