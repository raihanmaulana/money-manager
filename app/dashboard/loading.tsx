export default function Loading() {
  return (
    <div className="page-loading" role="status" aria-live="polite" aria-label="Memuat halaman">
      <div className="skel" style={{ height: '2.4rem', width: 'min(100%, 18rem)' }} />
      <div className="skel" style={{ height: '11rem' }} />
      <div className="skel" style={{ height: '14rem' }} />
    </div>
  )
}
