import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'officers' | 'operations' | 'borrowers'>('officers')
  const [activeFeature, setActiveFeature] = useState<0 | 1 | 2>(0)
  const [scrolled, setScrolled] = useState(false)
  const autoPlayRef = useRef(true)

  const advanceFeature = useCallback(() => {
    if (autoPlayRef.current) {
      setActiveFeature(prev => ((prev + 1) % 3) as 0 | 1 | 2)
    }
  }, [])

  const handleFeatureClick = (f: 0 | 1 | 2) => {
    autoPlayRef.current = false
    setActiveFeature(f)
  }

  // Feature 0: Chat typing animation
  const [typedUser, setTypedUser] = useState('')
  const [typedBot, setTypedBot] = useState('')
  const [typedFollowUp, setTypedFollowUp] = useState('')
  const [chatPhase, setChatPhase] = useState<'user' | 'bot' | 'followup' | 'done'>('user')

  const fullUserMsg = "What's the difference between FHA and conventional loans?"
  const fullBotMsg = "FHA loans need 3.5% down and 580+ credit. Conventional loans often have better rates with 620+ credit and 5-20% down."
  const followUpMsg = "Want me to compare monthly payments for both?"

  useEffect(() => {
    if (activeFeature !== 0) {
      setTypedUser('')
      setTypedBot('')
      setTypedFollowUp('')
      setChatPhase('user')
      return
    }
    setTypedUser('')
    setTypedBot('')
    setTypedFollowUp('')
    setChatPhase('user')
    let cancelled = false

    const run = async () => {
      setChatPhase('user')
      setTypedUser('')
      setTypedBot('')
      setTypedFollowUp('')
      for (let i = 1; i <= fullUserMsg.length; i++) {
        if (cancelled) return
        await new Promise(r => setTimeout(r, 22))
        setTypedUser(fullUserMsg.slice(0, i))
      }
      if (cancelled) return
      await new Promise(r => setTimeout(r, 400))

      setChatPhase('bot')
      for (let i = 1; i <= fullBotMsg.length; i++) {
        if (cancelled) return
        await new Promise(r => setTimeout(r, 18))
        setTypedBot(fullBotMsg.slice(0, i))
      }
      if (cancelled) return
      await new Promise(r => setTimeout(r, 300))

      setChatPhase('followup')
      for (let i = 1; i <= followUpMsg.length; i++) {
        if (cancelled) return
        await new Promise(r => setTimeout(r, 18))
        setTypedFollowUp(followUpMsg.slice(0, i))
      }
      setChatPhase('done')
      if (cancelled) return
      await new Promise(r => setTimeout(r, 2000))
      if (!cancelled) advanceFeature()
    }
    run()
    return () => { cancelled = true }
  }, [activeFeature, advanceFeature])

  // Feature 1: Doc pop-up + table fade-in animation
  const [docPhase, setDocPhase] = useState(0)

  useEffect(() => {
    if (activeFeature !== 1) {
      setDocPhase(0)
      return
    }
    setDocPhase(0)
    let cancelled = false

    const run = async () => {
      await new Promise(r => setTimeout(r, 300))
      if (cancelled) return
      setDocPhase(1)
      await new Promise(r => setTimeout(r, 600))
      if (cancelled) return
      setDocPhase(2)
      await new Promise(r => setTimeout(r, 400))
      if (cancelled) return
      setDocPhase(3)
      await new Promise(r => setTimeout(r, 400))
      if (cancelled) return
      setDocPhase(4)
      await new Promise(r => setTimeout(r, 400))
      if (cancelled) return
      setDocPhase(5)
      await new Promise(r => setTimeout(r, 2000))
      if (!cancelled) advanceFeature()
    }
    run()
    return () => { cancelled = true }
  }, [activeFeature, advanceFeature])

  // Feature 2: Auto-advance after delay
  useEffect(() => {
    if (activeFeature !== 2) return
    let cancelled = false
    const timer = setTimeout(() => {
      if (!cancelled) advanceFeature()
    }, 4000)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [activeFeature, advanceFeature])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar-inner">
          <a href="#" className="logo">
            <svg className="logo-icon" width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="3" r="2.5" fill="#1a1a1a"/>
              <circle cx="3.5" cy="12" r="2.5" fill="#1a1a1a"/>
              <circle cx="12.5" cy="12" r="2.5" fill="#1a1a1a"/>
            </svg>
            <span className="logo-text">diagon</span>
          </a>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="/login">Sign In</a></li>
          </ul>
          <a href="mailto:rexjordonez@gmail.com?subject=Diagon Demo Request" className="nav-cta">Book a Demo <span className="nav-arrow">&rarr;</span></a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <h1>The AI-Native Platform<br />for Mortgage Origination.</h1>
            <div className="hero-buttons">
              <a href="mailto:rexjordonez@gmail.com?subject=Diagon Demo Request" className="btn btn-dark-pill">Request a demo <span className="arrow">&rarr;</span></a>
            </div>
          </div>

        </div>

      </section>

      {/* Connected Card: Screenshot + Helps */}
      <div className="connected-card">
        {/* Dark Screenshot Top */}
        <div className="mockup-dark-backdrop">
          <div className="mockup-grid">
            {Array.from({ length: 180 }).map((_, i) => (
              <div key={i} className="grid-square" />
            ))}
          </div>
          <div className="mockup-container">
            <div className="mockup-modal">
              <div className="mockup-modal-logo">
                <svg width="14" height="14" viewBox="0 0 16 16">
                  <circle cx="8" cy="3" r="2.5" fill="#1a1a1a"/>
                  <circle cx="3.5" cy="12" r="2.5" fill="#1a1a1a"/>
                  <circle cx="12.5" cy="12" r="2.5" fill="#1a1a1a"/>
                </svg>
                <span>diagon</span>
              </div>
              <img src="/demo.png" alt="Diagon product interface" className="demo-img" />
            </div>
          </div>
        </div>

        {/* Helps Bottom */}
        <div className="helps-section" id="features">
          <div className="helps-columns">
            <div className="helps-col-left">
              <div className="helps-topbar">
                <span className="helps-label">How Diagon helps</span>
                <div className="tab-group">
                  <button className={`tab ${activeTab === 'officers' ? 'active' : ''}`} onClick={() => setActiveTab('officers')}>Loan Officers</button>
                  <button className={`tab ${activeTab === 'operations' ? 'active' : ''}`} onClick={() => setActiveTab('operations')}>Operations</button>
                  <button className={`tab ${activeTab === 'borrowers' ? 'active' : ''}`} onClick={() => setActiveTab('borrowers')}>Borrowers</button>
                </div>
              </div>
              <div className="helps-body">
                {activeTab === 'officers' && (
                  <p>Stop chasing documents. <span className="dot">&bull;</span> Start closing loans. <span className="dot">&bull;</span> Diagon handles the back and forth so you can focus on what you do best.</p>
                )}
                {activeTab === 'operations' && (
                  <p>Clean files arrive faster with fewer rechecks. <span className="dot">&bull;</span> Discrepancies surface early so your exception queue stays short.</p>
                )}
                {activeTab === 'borrowers' && (
                  <p>Clear next steps. <span className="dot">&bull;</span> Instant answers. <span className="dot">&bull;</span> No phone tag. <span className="dot">&bull;</span> Borrowers finish intake faster because the process finally makes sense.</p>
                )}
              </div>
            </div>
            <div className="helps-divider-v"></div>
            <div className="helps-col-right">
              <a href="#" className="helps-link">See the difference firsthand</a>
              <a href="mailto:rexjordonez@gmail.com?subject=Diagon Demo Request" className="btn btn-schedule">Schedule a Demo</a>
            </div>
          </div>
        </div>
      </div>

      {/* What We Do */}
      <section className="what-we-do">
        <div className="section-container">
          <span className="section-label-coral">What we do</span>
          <h3 className="what-title">An AI assistant that collects docs and asks the right questions for you.</h3>
          {/* Horizontal diagram (desktop) */}
          <div className="flow-diagram-card flow-desktop">
            <svg className="flow-svg" viewBox="0 0 960 340" preserveAspectRatio="xMidYMid meet">
              <path d="M140,170 C180,170 190,40 225,40" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
              <path d="M140,170 C180,170 190,92 225,92" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
              <path d="M140,170 C180,170 190,144 225,144" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
              <path d="M140,170 C180,170 190,196 225,196" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
              <path d="M140,170 C180,170 190,248 225,248" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
              <path d="M140,170 C180,170 190,300 225,300" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
              <path d="M385,40 C420,40 430,170 460,170" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
              <path d="M385,92 C420,92 430,170 460,170" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
              <path d="M385,144 C420,144 430,170 460,170" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
              <path d="M385,196 C420,196 430,170 460,170" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
              <path d="M385,248 C420,248 430,170 460,170" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
              <path d="M385,300 C420,300 430,170 460,170" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
              <line x1="600" y1="170" x2="640" y2="170" stroke="#1D5240" strokeWidth="2"/>
              <line x1="800" y1="170" x2="830" y2="170" stroke="#1D5240" strokeWidth="2"/>
              <rect x="20" y="147" width="120" height="46" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
              <text x="80" y="175" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="14" fontWeight="600" fill="#1a1a1a">Borrower</text>
              <rect x="225" y="25" width="160" height="30" rx="15" fill="white" stroke="#d1d5db" strokeWidth="1"/>
              <text x="305" y="44" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fill="#6b7280">can you resend...</text>
              <rect x="225" y="77" width="160" height="30" rx="15" fill="white" stroke="#d1d5db" strokeWidth="1"/>
              <text x="305" y="96" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fill="#6b7280">{"what's your start date?"}</text>
              <rect x="225" y="129" width="160" height="30" rx="15" fill="white" stroke="#d1d5db" strokeWidth="1"/>
              <text x="305" y="148" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fill="#6b7280">attach paystubs</text>
              <rect x="225" y="181" width="160" height="30" rx="15" fill="white" stroke="#d1d5db" strokeWidth="1"/>
              <text x="305" y="200" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fill="#6b7280">bank statements?</text>
              <rect x="225" y="233" width="160" height="30" rx="15" fill="white" stroke="#d1d5db" strokeWidth="1"/>
              <text x="305" y="252" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fill="#6b7280">W-2s for 2 years</text>
              <rect x="225" y="285" width="160" height="30" rx="15" fill="white" stroke="#d1d5db" strokeWidth="1"/>
              <text x="305" y="304" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fill="#6b7280">tax returns?</text>
              <rect x="460" y="147" width="140" height="46" rx="10" fill="white" stroke="#1D5240" strokeWidth="2"/>
              <text x="530" y="175" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="14" fontWeight="600" fill="#1D5240">Diagon</text>
              <rect x="640" y="153" width="160" height="34" rx="17" fill="white" stroke="#1D5240" strokeWidth="1.5"/>
              <text x="720" y="174" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fontWeight="500" fill="#1D5240">Full applicant profile</text>
              <rect x="830" y="147" width="120" height="46" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
              <text x="890" y="175" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="14" fontWeight="600" fill="#1a1a1a">Loan Officer</text>
            </svg>
          </div>

          {/* Vertical diagram (mobile) */}
          <div className="flow-diagram-card flow-mobile">
            <svg className="flow-svg" viewBox="0 0 280 820" preserveAspectRatio="xMidYMid meet">
              {/* Borrower node */}
              <rect x="80" y="0" width="120" height="42" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
              <text x="140" y="26" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="13" fontWeight="600" fill="#1a1a1a">Borrower</text>

              {/* Line down */}
              <line x1="140" y1="42" x2="140" y2="70" stroke="#d1d5db" strokeWidth="1.5"/>

              {/* Pills */}
              <rect x="40" y="70" width="200" height="28" rx="14" fill="white" stroke="#d1d5db" strokeWidth="1"/>
              <text x="140" y="88" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fill="#6b7280">can you resend...</text>

              <rect x="40" y="106" width="200" height="28" rx="14" fill="white" stroke="#d1d5db" strokeWidth="1"/>
              <text x="140" y="124" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fill="#6b7280">{"what's your start date?"}</text>

              <rect x="40" y="142" width="200" height="28" rx="14" fill="white" stroke="#d1d5db" strokeWidth="1"/>
              <text x="140" y="160" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fill="#6b7280">attach paystubs</text>

              <rect x="40" y="178" width="200" height="28" rx="14" fill="white" stroke="#d1d5db" strokeWidth="1"/>
              <text x="140" y="196" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fill="#6b7280">bank statements?</text>

              <rect x="40" y="214" width="200" height="28" rx="14" fill="white" stroke="#d1d5db" strokeWidth="1"/>
              <text x="140" y="232" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fill="#6b7280">W-2s for 2 years</text>

              <rect x="40" y="250" width="200" height="28" rx="14" fill="white" stroke="#d1d5db" strokeWidth="1"/>
              <text x="140" y="268" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fill="#6b7280">tax returns?</text>

              {/* Line down */}
              <line x1="140" y1="278" x2="140" y2="310" stroke="#d1d5db" strokeWidth="1.5"/>

              {/* Diagon node */}
              <rect x="70" y="310" width="140" height="42" rx="10" fill="white" stroke="#1D5240" strokeWidth="2"/>
              <text x="140" y="336" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="13" fontWeight="600" fill="#1D5240">Diagon</text>

              {/* Coral line down */}
              <line x1="140" y1="352" x2="140" y2="384" stroke="#1D5240" strokeWidth="2"/>

              {/* Full applicant profile */}
              <rect x="40" y="384" width="200" height="32" rx="16" fill="white" stroke="#1D5240" strokeWidth="1.5"/>
              <text x="140" y="404" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="11" fontWeight="500" fill="#1D5240">Full applicant profile</text>

              {/* Coral line down */}
              <line x1="140" y1="416" x2="140" y2="448" stroke="#1D5240" strokeWidth="2"/>

              {/* Loan Officer node */}
              <rect x="80" y="448" width="120" height="42" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
              <text x="140" y="474" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="13" fontWeight="600" fill="#1a1a1a">Loan Officer</text>
            </svg>
          </div>
        </div>
      </section>

      {/* Borrower Experience */}
      <section className="borrower-experience">
        <div className="bx-layout">
          <div className="bx-left">
            <span className="section-label-coral">Borrower Experience</span>
            <h3 className="bx-title">Borrowers finish applications. Finally.</h3>

            <div className="bx-features">
              <button className={`bx-feature ${activeFeature === 0 ? 'active' : ''}`} onClick={() => handleFeatureClick(0)}>
                <div className="bx-feature-header">
                  <span className="bx-dot"></span>
                  <span className="bx-feature-name">Instant answers, any time</span>
                </div>
                {activeFeature === 0 && (
                  <p className="bx-feature-desc">Terms, requirements, next steps. Borrowers get compliant answers 24/7 without waiting for a callback.</p>
                )}
              </button>
              <button className={`bx-feature ${activeFeature === 1 ? 'active' : ''}`} onClick={() => handleFeatureClick(1)}>
                <div className="bx-feature-header">
                  <span className="bx-dot"></span>
                  <span className="bx-feature-name">Upload once, never retype</span>
                </div>
                {activeFeature === 1 && (
                  <p className="bx-feature-desc">Documents are parsed and fields auto-populated across the entire application.</p>
                )}
              </button>
              <button className={`bx-feature ${activeFeature === 2 ? 'active' : ''}`} onClick={() => handleFeatureClick(2)}>
                <div className="bx-feature-header">
                  <span className="bx-dot"></span>
                  <span className="bx-feature-name">Forms that adapt</span>
                </div>
                {activeFeature === 2 && (
                  <p className="bx-feature-desc">Dynamic forms that only show relevant fields based on the borrower's situation.</p>
                )}
              </button>
            </div>
          </div>

          <div className="bx-right">
            {/* Feature 0: Penny Chat */}
            {activeFeature === 0 && (
              <div className="bx-card">
                <div className="bx-card-header">
                  <svg className="bx-card-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" stroke="#1D5240" strokeWidth="1.2" fill="none"/>
                  </svg>
                  <span className="bx-card-title">Penny</span>
                </div>
                <div className="bx-card-body">
                  {typedUser && (
                    <div className="bx-chat-msg user">
                      {typedUser}{chatPhase === 'user' && <span className="typing-cursor">|</span>}
                    </div>
                  )}
                  {typedBot && (
                    <div className="bx-chat-msg bot">
                      <p>{typedBot}{chatPhase === 'bot' && <span className="typing-cursor">|</span>}</p>
                    </div>
                  )}
                  {typedFollowUp && (
                    <div className="bx-chat-msg bot">
                      <p>{typedFollowUp}{chatPhase === 'followup' && <span className="typing-cursor">|</span>}</p>
                    </div>
                  )}
                  {chatPhase === 'done' && (
                    <div className="bx-chat-actions anim-fade-in">
                      <button className="bx-chat-btn bx-chat-btn-outline">Compare payments</button>
                      <button className="bx-chat-btn bx-chat-btn-dark">Ask another question</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feature 1: Document Processing */}
            {activeFeature === 1 && (
              <div className="bx-card">
                <div className="bx-card-header">
                  <span className="bx-card-title">Document Processing</span>
                </div>
                <div className="bx-card-body">
                  {docPhase >= 1 && (
                    <div className="bx-doc-file anim-pop-in">
                      <span className="bx-doc-icon">&#128196;</span>
                      <div className="bx-doc-info">
                        <strong>W2_2024_JohnDoe.pdf</strong>
                        <span className="bx-doc-status"><span className="bx-status-dot"></span>Complete</span>
                      </div>
                    </div>
                  )}
                  {docPhase >= 2 && (
                    <p className="bx-doc-prefill anim-fade-in">Extracted & prefilled</p>
                  )}
                  <div className="bx-doc-table">
                    {docPhase >= 2 && (
                      <div className="bx-doc-row header anim-fade-in">
                        <span>Field</span><span>Extracted Value</span>
                      </div>
                    )}
                    {docPhase >= 3 && (
                      <div className="bx-doc-row anim-fade-in">
                        <span>Employer name</span><span>Acme Corp</span>
                      </div>
                    )}
                    {docPhase >= 4 && (
                      <div className="bx-doc-row anim-fade-in">
                        <span>Annual income</span><span>$92,400</span>
                      </div>
                    )}
                    {docPhase >= 5 && (
                      <div className="bx-doc-row anim-fade-in">
                        <span>Tax year</span><span>2024</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Feature 2: Adaptive Forms */}
            {activeFeature === 2 && (
              <div className="bx-card">
                <div className="bx-card-header">
                  <span className="bx-card-title">Application Form</span>
                  <span className="bx-personalized">Personalized</span>
                </div>
                <div className="bx-card-body">
                  <div className="bx-form-rows">
                    <div className="bx-form-row">
                      <span className="bx-form-name">Employment</span>
                      <span className="bx-form-count">3 fields</span>
                    </div>
                    <div className="bx-form-row">
                      <span className="bx-form-name">Property</span>
                      <span className="bx-form-count">5 fields</span>
                    </div>
                    <div className="bx-form-row hidden-row">
                      <span className="bx-form-name strikethrough">Self-Employment</span>
                      <span className="bx-form-hidden">Hidden</span>
                      <span className="bx-form-reason">Not applicable since you indicated W-2 income only</span>
                    </div>
                    <div className="bx-form-row hidden-row">
                      <span className="bx-form-name strikethrough">VA Eligibility</span>
                      <span className="bx-form-hidden">Hidden</span>
                      <span className="bx-form-reason">Not applicable for conventional loan</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Document Verification */}
      <section className="doc-verification">
        <div className="dv-layout">
          <div className="dv-left">
            <div className="dv-card">
              <div className="dv-card-header">
                <span className="dv-card-title">Document Verification</span>
                <span className="dv-review-needed"><span className="dv-review-dot"></span>Review needed</span>
              </div>
              <div className="dv-card-body">
                <div className="dv-file">
                  <div className="dv-file-icon">&#128196;</div>
                  <div className="dv-file-info">
                    <strong>Bank_Statement_Dec2024.pdf</strong>
                    <span>Uploaded 2 min ago</span>
                  </div>
                </div>
                <div className="dv-checks">
                  <h5>AI Pre-verification</h5>
                  <div className="dv-check-row">
                    <span>Document authenticity</span>
                    <span className="dv-pass">&#10003; Verified</span>
                  </div>
                  <div className="dv-check-row">
                    <span>Account holder match</span>
                    <span className="dv-pass">&#10003; Verified</span>
                  </div>
                  <div className="dv-check-row dv-flagged-row">
                    <span>Large deposit detected</span>
                    <span className="dv-flag">&#9888; Flagged</span>
                  </div>
                </div>
                <div className="dv-penny">
                  <svg className="dv-penny-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" stroke="#1D5240" strokeWidth="1.2" fill="none"/>
                  </svg>
                  <div>
                    <span className="dv-penny-label">Penny is asking…</span>
                    <p>Where did the $15K deposit on Dec 12 come from?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="dv-right">
            <div className="dv-text-content">
              <span className="section-label-coral">Document Verification</span>
              <h3 className="dv-title">Catch problems before underwriting does.</h3>
              <p className="dv-subtitle">Issues get caught and clarified before the file reaches your desk.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Loan Officer Dashboard */}
      <section className="lo-dashboard">
        <div className="lo-layout">
          <div className="lo-left">
            <div className="lo-text-content">
              <span className="section-label-coral">Loan Officer Dashboard</span>
              <h3 className="lo-title">Your whole pipeline. One screen.</h3>
              <p className="lo-subtitle">Every borrower, every document, every flag. No more hunting through tabs.</p>
            </div>
          </div>
          <div className="lo-right">
            <div className="lo-card">
              <div className="lo-card-header">
                <span className="lo-card-title">Active Applications</span>
                <span className="lo-pipeline-count">4 in pipeline</span>
              </div>
              <div className="lo-list">
                <div className="lo-row lo-row-ready">
                  <div className="lo-row-top">
                    <div className="lo-avatar">SM</div>
                    <div className="lo-info">
                      <strong>Sarah Mitchell</strong>
                      <span>Conventional &middot; $425K</span>
                    </div>
                    <span className="lo-status-ready"><span className="lo-status-dot coral"></span>Ready</span>
                  </div>
                  <div className="lo-row-bottom">
                    <span className="lo-docs">12/12 docs</span>
                    <a href="#" className="lo-chat-link">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2h12v9H5l-3 3V2z" stroke="#1D5240" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                      Chat
                    </a>
                  </div>
                </div>
                <div className="lo-row lo-row-flagged">
                  <div className="lo-row-top">
                    <div className="lo-avatar">JC</div>
                    <div className="lo-info">
                      <strong>James Chen</strong>
                      <span>FHA &middot; $280K</span>
                    </div>
                    <span className="lo-status-flagged">&#9888; Flagged</span>
                  </div>
                  <div className="lo-row-bottom">
                    <span className="lo-docs">8/10 docs</span>
                    <span className="lo-flag-reason">Income gap</span>
                    <a href="#" className="lo-chat-link">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2h12v9H5l-3 3V2z" stroke="#1D5240" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                      Chat
                    </a>
                  </div>
                </div>
                <div className="lo-row lo-row-progress">
                  <div className="lo-row-top">
                    <div className="lo-avatar">AP</div>
                    <div className="lo-info">
                      <strong>Amanda Patel</strong>
                      <span>Jumbo &middot; $850K</span>
                    </div>
                    <span className="lo-status-progress"><span className="lo-status-dot gray"></span>In progress</span>
                  </div>
                  <div className="lo-row-bottom">
                    <span className="lo-docs">5/14 docs</span>
                    <a href="#" className="lo-chat-link">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2h12v9H5l-3 3V2z" stroke="#1D5240" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                      Chat
                    </a>
                  </div>
                </div>
              </div>
              <div className="lo-penny-activity">
                <div className="lo-penny-header">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" stroke="#1D5240" strokeWidth="1.2" fill="none"/>
                  </svg>
                  <span>Penny activity</span>
                </div>
                <p>Asked James about 2-month employment gap &middot; Verified Sarah's bank statements</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="demo" className="cta-section">
        <div className="section-container">
          <h2>Ready to stop chasing paperwork?</h2>
          <a href="mailto:rexjordonez@gmail.com?subject=Diagon Demo Request" className="btn btn-cta">Request a Demo</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <circle cx="8" cy="3" r="2.5" fill="#ffffff"/>
                <circle cx="3.5" cy="12" r="2.5" fill="#ffffff"/>
                <circle cx="12.5" cy="12" r="2.5" fill="#ffffff"/>
              </svg>
              <span>diagon</span>
            </div>
            <p>The AI-native platform for mortgage origination. We handle the back-and-forth with borrowers so you can focus on closing loans.</p>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Terms</a></li>
              <li><a href="#">Privacy</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <ul>
              <li><a href="#">LinkedIn</a></li>
              <li><a href="#">Twitter</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Diagon, Inc. d/b/a Diagon. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}

export default App
