/**
 * ClubRedirectPage — district-free club URL (#320)
 *
 * Resolves /club/:clubId to /district/:districtId/club/:clubId
 * by fetching the club-index from CDN.
 */
import React from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCdnClubIndex } from '../services/cdn'

const ClubRedirectPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['club-index'],
    queryFn: fetchCdnClubIndex,
    staleTime: 15 * 60 * 1000,
  })

  React.useEffect(() => {
    if (!data || !clubId) return

    const club = data.clubs[clubId]
    if (club) {
      const params = searchParams.toString()
      const url = `/district/${club.districtId}/club/${clubId}${params ? `?${params}` : ''}`
      navigate(url, { replace: true })
    }
  }, [data, clubId, navigate, searchParams])

  if (isLoading) {
    return (
      <div
        className="tm-container"
        style={{ padding: '2rem', textAlign: 'center' }}
      >
        <div className="tm-loading-spinner" aria-label="Looking up club..." />
        <p className="text-gray-500 mt-4 font-tm-body">Looking up club...</p>
      </div>
    )
  }

  if (isError || !data || (data && clubId && !data.clubs[clubId])) {
    return (
      <div className="tm-container p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Club Not Found
          </h2>
          <p className="text-red-600 mb-4 font-tm-body">
            Club ID <code className="font-mono">{clubId}</code> was not found in
            the current data.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-tm-loyal-blue text-white rounded hover:bg-tm-loyal-blue-80 transition-colors"
          >
            Back to Rankings
          </a>
        </div>
      </div>
    )
  }

  return null
}

export default ClubRedirectPage
