/**
 * Alert Verification Components
 * Social verification system for community-based alert validation
 */

'use client'

import React, { useState, useCallback } from 'react'
import { 
  ThumbsUp, ThumbsDown, MessageSquare, User, Calendar, 
  CheckCircle, XCircle, AlertTriangle, TrendingUp
} from 'lucide-react'
import { useAlertStore } from '@/stores/alerts'
import type { Alert, VoteType, AlertVerificationRequest } from '@/types'
import { useNotifications } from '../notifications/NotificationSystem'

// Main Verification Interface
export const AlertVerificationPanel: React.FC<{
  alert: Alert
  className?: string
}> = ({ alert, className = '' }) => {
  const { verifyAlert } = useAlertStore()
  const { addNotification } = useNotifications()
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userVote, setUserVote] = useState<VoteType | null>(
    alert.verification_votes?.user_vote || null
  )
  
  const handleVote = async (vote: VoteType) => {
    if (userVote === vote) return // Already voted this way
    
    setIsSubmitting(true)
    
    try {
      const request: AlertVerificationRequest = {
        alert_id: alert.id,
        vote,
        comment: comment.trim() || undefined
      }
      
      await verifyAlert(request)
      setUserVote(vote)
      setComment('')
      
      addNotification({
        type: 'success',
        title: 'Vote Submitted',
        message: `Your ${vote} vote has been recorded`,
        duration: 3000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Vote Failed',
        message: 'Failed to submit your vote. Please try again.',
        duration: 5000
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const votes = alert.verification_votes || { agree: 0, disagree: 0 }
  const totalVotes = votes.agree + votes.disagree
  const agreementRatio = totalVotes > 0 ? (votes.agree / totalVotes) * 100 : 0
  
  const getVerificationStatus = () => {
    if (totalVotes === 0) return { status: 'pending', color: 'gray', text: 'No votes yet' }
    if (agreementRatio >= 70) return { status: 'verified', color: 'green', text: 'Community Verified' }
    if (agreementRatio <= 30) return { status: 'disputed', color: 'red', text: 'Community Disputed' }
    return { status: 'inconclusive', color: 'yellow', text: 'Inconclusive' }
  }
  
  const verificationStatus = getVerificationStatus()
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Community Verification</h3>
        
        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium
          ${verificationStatus.color === 'green' ? 'bg-green-50 text-green-700' : ''}
          ${verificationStatus.color === 'red' ? 'bg-red-50 text-red-700' : ''}
          ${verificationStatus.color === 'yellow' ? 'bg-yellow-50 text-yellow-700' : ''}
          ${verificationStatus.color === 'gray' ? 'bg-gray-50 text-gray-700' : ''}
        `}>
          {verificationStatus.status === 'verified' && <CheckCircle className="h-4 w-4 mr-1" />}
          {verificationStatus.status === 'disputed' && <XCircle className="h-4 w-4 mr-1" />}
          {verificationStatus.status === 'inconclusive' && <AlertTriangle className="h-4 w-4 mr-1" />}
          {verificationStatus.text}
        </div>
      </div>
      
      {/* Vote Statistics */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              <span className="text-lg font-semibold text-green-600">{votes.agree}</span>
              <span className="text-sm text-gray-500">Agree</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <ThumbsDown className="h-5 w-5 text-red-600" />
              <span className="text-lg font-semibold text-red-600">{votes.disagree}</span>
              <span className="text-sm text-gray-500">Disagree</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{totalVotes}</div>
            <div className="text-sm text-gray-500">Total Votes</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div className="flex h-full">
            <div
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${agreementRatio}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-300"
              style={{ width: `${100 - agreementRatio}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{Math.round(agreementRatio)}% agree</span>
          <span>{Math.round(100 - agreementRatio)}% disagree</span>
        </div>
      </div>
      
      {/* Voting Interface */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleVote('agree')}
            disabled={isSubmitting || userVote === 'agree'}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              userVote === 'agree'
                ? 'bg-green-600 text-white'
                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsUp className="h-5 w-5 mr-2" />
            {userVote === 'agree' ? 'You Agreed' : 'I Agree'}
          </button>
          
          <button
            onClick={() => handleVote('disagree')}
            disabled={isSubmitting || userVote === 'disagree'}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              userVote === 'disagree'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsDown className="h-5 w-5 mr-2" />
            {userVote === 'disagree' ? 'You Disagreed' : 'I Disagree'}
          </button>
        </div>
        
        {/* Comment Box */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">
              Add a comment (optional)
            </label>
          </div>
          
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your reasoning for this vote..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            maxLength={500}
          />
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {comment.length}/500 characters
            </span>
            
            {comment.trim() && (
              <button
                onClick={() => handleVote(userVote || 'agree')}
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit with Comment'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* User's Previous Vote */}
      {userVote && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            {userVote === 'agree' ? (
              <ThumbsUp className="h-4 w-4 text-green-600" />
            ) : (
              <ThumbsDown className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm text-blue-700">
              You {userVote === 'agree' ? 'agreed' : 'disagreed'} with this alert
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Verification History Component
export const VerificationHistory: React.FC<{
  alert: Alert
  className?: string
}> = ({ alert, className = '' }) => {
  // This would fetch verification history from the API
  const [history, setHistory] = useState([
    {
      id: '1',
      user: { name: 'John Doe', avatar: null },
      vote: 'agree' as VoteType,
      comment: 'Clear evidence of deforestation visible in the satellite imagery.',
      timestamp: '2025-01-08T10:30:00Z'
    },
    {
      id: '2',
      user: { name: 'Jane Smith', avatar: null },
      vote: 'disagree' as VoteType,
      comment: 'This appears to be seasonal vegetation change, not permanent deforestation.',
      timestamp: '2025-01-08T11:15:00Z'
    }
  ])
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Comments</h3>
      
      {history.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="text-gray-500">No comments yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="flex space-x-3">
              <div className="flex-shrink-0">
                {entry.user.avatar ? (
                  <img
                    src={entry.user.avatar}
                    alt={entry.user.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{entry.user.name}</span>
                  
                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    entry.vote === 'agree'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {entry.vote === 'agree' ? (
                      <ThumbsUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ThumbsDown className="h-3 w-3 mr-1" />
                    )}
                    {entry.vote}
                  </div>
                  
                  <span className="text-xs text-gray-500">{formatTime(entry.timestamp)}</span>
                </div>
                
                <p className="text-sm text-gray-700">{entry.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Verification Stats Widget
export const VerificationStatsWidget: React.FC<{
  alerts: Alert[]
  className?: string
}> = ({ alerts, className = '' }) => {
  const verifiedAlerts = alerts.filter(alert => {
    const votes = alert.verification_votes
    if (!votes || votes.agree + votes.disagree === 0) return false
    const agreementRatio = votes.agree / (votes.agree + votes.disagree)
    return agreementRatio >= 0.7
  })
  
  const disputedAlerts = alerts.filter(alert => {
    const votes = alert.verification_votes
    if (!votes || votes.agree + votes.disagree === 0) return false
    const agreementRatio = votes.agree / (votes.agree + votes.disagree)
    return agreementRatio <= 0.3
  })
  
  const pendingAlerts = alerts.filter(alert => {
    const votes = alert.verification_votes
    return !votes || votes.agree + votes.disagree === 0
  })
  
  const totalVotes = alerts.reduce((sum, alert) => {
    const votes = alert.verification_votes
    return sum + (votes ? votes.agree + votes.disagree : 0)
  }, 0)
  
  const averageConfidence = alerts.reduce((sum, alert) => {
    const votes = alert.verification_votes
    if (!votes || votes.agree + votes.disagree === 0) return sum
    const agreementRatio = votes.agree / (votes.agree + votes.disagree)
    return sum + agreementRatio
  }, 0) / alerts.filter(alert => {
    const votes = alert.verification_votes
    return votes && votes.agree + votes.disagree > 0
  }).length
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{verifiedAlerts.length}</div>
          <div className="text-xs text-gray-500">Verified</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{disputedAlerts.length}</div>
          <div className="text-xs text-gray-500">Disputed</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{pendingAlerts.length}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalVotes}</div>
          <div className="text-xs text-gray-500">Total Votes</div>
        </div>
      </div>
      
      {!isNaN(averageConfidence) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Community Confidence</span>
            <span className="text-lg font-semibold text-gray-900">
              {Math.round(averageConfidence * 100)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${averageConfidence * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Quick Verification Actions Component
export const QuickVerificationActions: React.FC<{
  alert: Alert
  onVerify: (vote: VoteType) => void
  className?: string
}> = ({ alert, onVerify, className = '' }) => {
  const userVote = alert.verification_votes?.user_vote
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600">Quick verify:</span>
      
      <button
        onClick={() => onVerify('agree')}
        disabled={userVote === 'agree'}
        className={`p-2 rounded-lg transition-all ${
          userVote === 'agree'
            ? 'bg-green-600 text-white'
            : 'bg-green-50 text-green-700 hover:bg-green-100'
        } disabled:opacity-50`}
      >
        <ThumbsUp className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => onVerify('disagree')}
        disabled={userVote === 'disagree'}
        className={`p-2 rounded-lg transition-all ${
          userVote === 'disagree'
            ? 'bg-red-600 text-white'
            : 'bg-red-50 text-red-700 hover:bg-red-100'
        } disabled:opacity-50`}
      >
        <ThumbsDown className="h-4 w-4" />
      </button>
    </div>
  )
}