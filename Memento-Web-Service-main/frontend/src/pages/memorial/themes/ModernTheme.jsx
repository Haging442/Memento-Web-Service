//frontend/src/pages/memorial/themes/ModernTheme.jsx 모던

export default function ModernTheme({ data }) {
  const { space, photos, guestbook } = data;

  const colors = {
  primary: '#FFFFFF',
  secondary: '#F5F5F5',
  accent: '#000000',
  text: '#0F0F0F',
  border: '#D1D1D1'
};


  return (
    <div style={{ 
      minHeight: '100vh', 
      background: colors.primary,
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* 미니멀 헤더 */}
      <header style={{
        background: colors.primary,
        padding: '100px 20px',
        textAlign: 'center',
        borderBottom: `2px solid ${colors.accent}`
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {space.profile_image && (
            <img
              src={space.profile_image}
              alt={space.display_name}
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '0',
                objectFit: 'cover',
                border: `3px solid ${colors.accent}`,
                marginBottom: '40px'
              }}
            />
          )}
          
          <h1 style={{ 
            fontSize: '56px', 
            fontWeight: '900', 
            color: colors.accent,
            marginBottom: '20px',
            letterSpacing: '-2px',
            textTransform: 'uppercase'
          }}>
            {space.display_name}
          </h1>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px'
          }}>
            <div style={{
              width: '60px',
              height: '2px',
              background: colors.accent
            }}></div>
            <p style={{ 
              fontSize: '16px', 
              color: colors.text,
              margin: 0,
              fontWeight: '500',
              letterSpacing: '2px'
            }}>
              {space.birth_date} — {space.death_date || 'PRESENT'}
            </p>
            <div style={{
              width: '60px',
              height: '2px',
              background: colors.accent
            }}></div>
          </div>

          {space.memorial_message && (
            <div style={{
              background: colors.secondary,
              padding: '40px 50px',
              borderLeft: `5px solid ${colors.accent}`,
              textAlign: 'left',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              <p style={{
                fontSize: '18px',
                color: colors.text,
                lineHeight: 1.8,
                fontWeight: '400'
              }}>
                {space.memorial_message}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* 사진 갤러리 */}
      {photos.length > 0 && (
        <section style={{ 
          maxWidth: '1400px', 
          margin: '100px auto',
          padding: '0 20px'
        }}>
          <div style={{
            marginBottom: '60px'
          }}>
            <h2 style={{ 
              fontSize: '42px', 
              fontWeight: '900', 
              color: colors.accent,
              letterSpacing: '-1px',
              textTransform: 'uppercase',
              marginBottom: '20px'
            }}>
              GALLERY
            </h2>
            <div style={{
              width: '100px',
              height: '4px',
              background: colors.accent
            }}></div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '2px',
            background: colors.accent
          }}>
            {photos.map(photo => (
              <div key={photo.id} style={{ 
                position: 'relative',
                paddingTop: '100%',
                overflow: 'hidden'
              }}>
                <img
                  src={`http://localhost:4000${photo.image_url}`}
                  alt="Memory"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'all 0.4s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 방명록 */}
      <section style={{ 
        maxWidth: '1000px', 
        margin: '120px auto',
        padding: '0 20px'
      }}>
        <div style={{
          marginBottom: '60px'
        }}>
          <h2 style={{ 
            fontSize: '42px', 
            fontWeight: '900', 
            color: colors.accent,
            letterSpacing: '-1px',
            textTransform: 'uppercase',
            marginBottom: '20px'
          }}>
            GUESTBOOK
          </h2>
          <div style={{
            width: '100px',
            height: '4px',
            background: colors.accent
          }}></div>
        </div>
        
        {guestbook.length === 0 ? (
          <div style={{
            background: colors.secondary,
            padding: '80px 40px',
            textAlign: 'center'
          }}>
            <p style={{ 
              color: colors.text,
              fontSize: '18px',
              fontWeight: '500',
              letterSpacing: '1px'
            }}>
              NO ENTRIES YET
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {guestbook.map((entry, index) => (
              <div key={entry.id} style={{
                background: index % 2 === 0 ? colors.primary : colors.secondary,
                padding: '40px',
                borderBottom: `1px solid ${colors.border}`
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '24px'
                }}>
                  <span style={{ 
                    fontWeight: '700', 
                    color: colors.accent,
                    fontSize: '20px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    {entry.author_name}
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: colors.text,
                    opacity: 0.6,
                    letterSpacing: '1px',
                    fontWeight: '500'
                  }}>
                    {new Date(entry.created_at).toLocaleDateString('en-US').toUpperCase()}
                  </span>
                </div>
                <p style={{ 
                  color: colors.text,
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  fontSize: '16px',
                  fontWeight: '400'
                }}>
                  {entry.message}
                </p>
                {entry.image_url && (
                  <div style={{ marginTop: '24px' }}>
                    <img
                      src={`http://localhost:4000${entry.image_url}`}
                      alt="Attachment"
                      style={{
                        width: '100%',
                        maxWidth: '600px',
                        border: `2px solid ${colors.accent}`
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 푸터 */}
      <footer style={{
        background: colors.accent,
        color: colors.primary,
        padding: '60px 20px',
        textAlign: 'center',
        marginTop: '120px'
      }}>
        <p style={{ 
          fontSize: '13px',
          fontWeight: '600',
          letterSpacing: '3px'
        }}>
          MEMENTO © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}