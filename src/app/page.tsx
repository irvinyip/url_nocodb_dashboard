'use client';

import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

interface UrlEntry {
  id: string;
  title: string;
  url: string;
  description: string;
}

interface UrlStatus {
  [key: string]: 'alive' | 'dead' | 'checking';
}

export default function Dashboard() {
  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [filteredUrls, setFilteredUrls] = useState<UrlEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urlStatus, setUrlStatus] = useState<UrlStatus>({});
  const [checkedBatches, setCheckedBatches] = useState<number[]>([]);
  const BATCH_SIZE = 9;

  useEffect(() => {
    fetchUrls();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Intersection Observer for infinite scroll status checking
  useEffect(() => {
    if (filteredUrls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardIndex = parseInt(entry.target.getAttribute('data-index') || '0');
            const batchIndex = Math.floor(cardIndex / BATCH_SIZE);
            
            // Check if this batch needs to be processed
            if (!checkedBatches.includes(batchIndex)) {
              console.log('Card', cardIndex, 'is visible, checking batch', batchIndex);
              checkUrlBatch(filteredUrls, batchIndex);
            }
          }
        });
      },
      {
        rootMargin: '50px', // Start loading slightly before the cards come into view
        threshold: 0.1 // Trigger when 10% of the card is visible
      }
    );

    // Observe all cards
    const cards = document.querySelectorAll('.url-card');
    cards.forEach((card) => {
      observer.observe(card);
    });

    return () => {
      observer.disconnect();
    };
  }, [filteredUrls, checkedBatches]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const filtered = urls.filter(url =>
      url.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUrls(filtered);
  }, [searchTerm, urls]);

  const fetchUrls = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/urls');
      
      if (!res.ok) {
        throw new Error('Failed to fetch URLs');
      }
      
      const data = await res.json();
      console.log('Fetched URLs:', data.urls.length);
      setUrls(data.urls);
      setFilteredUrls(data.urls);
      
      // Check first batch of URLs after loading
      console.log('Starting status check for first batch...');
      setTimeout(() => {
        checkUrlBatch(data.urls, 0);
      }, 1000); // Delay to avoid overwhelming the browser
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoClick = (url: string) => {
    window.open(url, '_blank');
  };

  const checkUrlBatch = async (urls: UrlEntry[], batchIndex: number) => {
    if (checkedBatches.includes(batchIndex)) {
      console.log('Batch', batchIndex, 'already checked');
      return;
    }
    
    const startIndex = batchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, urls.length);
    const batchUrls = urls.slice(startIndex, endIndex);
    
    console.log('Checking batch', batchIndex, 'URLs', startIndex, 'to', endIndex - 1);
    
    // Mark this batch as checked
    setCheckedBatches(prev => [...prev, batchIndex]);
    
    // Set status to checking for this batch
    const statusMap: UrlStatus = {};
    batchUrls.forEach(url => {
      statusMap[url.id] = 'checking';
    });
    setUrlStatus(prev => ({ ...prev, ...statusMap }));
    
    // Check each URL in the batch
    for (const url of batchUrls) {
      console.log('Checking status for:', url.title, 'at', url.url);
      try {
        // Use a HEAD request to check if URL is alive
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        await fetch(url.url, {
          method: 'HEAD',
          mode: 'no-cors', // This allows cross-origin requests
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // For no-cors mode, we can't read the response status, but if we get here, it means the request succeeded
        console.log('URL is alive:', url.title);
        setUrlStatus(prev => ({
          ...prev,
          [url.id]: 'alive'
        }));
      } catch (error) {
        // If there's any error (network, timeout, etc.), mark as dead
        console.log('URL is dead:', url.title, error);
        setUrlStatus(prev => ({
          ...prev,
          [url.id]: 'dead'
        }));
      }
      
      // Add small delay between checks to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    console.log('Batch', batchIndex, 'status check completed');
  };

  const StatusIndicator = ({ status }: { status: 'alive' | 'dead' | 'checking' }) => {
    console.log('StatusIndicator rendering with status:', status);
    const getStatusStyle = () => {
      switch (status) {
        case 'alive':
          return {
            backgroundColor: '#28a745',
            boxShadow: '0 0 8px rgba(40, 167, 69, 0.6)',
            animation: 'pulse 2s infinite'
          };
        case 'dead':
          return {
            backgroundColor: '#dc3545',
            opacity: 0.7
          };
        case 'checking':
          return {
            backgroundColor: '#ffc107',
            animation: 'pulse 1s infinite'
          };
        default:
          return {
            backgroundColor: '#6c757d',
            opacity: 0.5
          };
      }
    };

    return (
      <div
        className="position-absolute"
        style={{
          top: '8px',
          left: '8px',
          width: '16px',
          height: '16px',
          border: '3px solid white',
          borderRadius: '50%',
          zIndex: 1000,
          ...getStatusStyle()
        }}
        title={status === 'alive' ? 'URL is alive' : status === 'dead' ? 'URL is not responding' : 'Checking status...'}
      />
    );
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="text-center mb-4">
        <h1 className="display-4">Nocodb URL Shortening Dashboard</h1>
        <p className="lead">Manage and access your shortened URLs</p>
      </div>

      <div className="row mb-4">
        <div className="col-md-10 mx-auto">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search URLs by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-outline-secondary" type="button">
               🔍 Search
             </button>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {filteredUrls.map((url, index) => {
          console.log('Rendering card for', url.title, 'with status:', urlStatus[url.id] || 'checking');
          return (
            <div key={url.id} className="col-md-4 url-card" data-index={index}>
              <div className="card h-100 shadow-sm position-relative">
                <StatusIndicator status={urlStatus[url.id] || 'checking'} />
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title text-primary">&nbsp;&nbsp;{url.title}</h5>
                  <p className="card-text flex-grow-1">{url.description}</p>
                  <div className="d-flex justify-content-end">
                    <button
                      className="btn btn-success"
                      onClick={() => handleGoClick(url.url)}
                    >
                      GO →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUrls.length === 0 && (
        <div className="text-center mt-5">
          <p className="text-muted">No URLs found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
