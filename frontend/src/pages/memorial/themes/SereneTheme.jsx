//frontend/src/pages/memorial/themes/SereneTheme.jsx 고요한

export default function SereneTheme({ data }) {
  const { space, photos, guestbook } = data;

  const colors = {
  primary: '#F4F5F7',
  secondary: '#E1E4E7',
  accent: '#9AA0A6',
  text: '#4B4F52',
  border: '#C8CCD0'
};

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: colors.primary,
      fontFamily: '"Noto Sans KR", -apple-system, sans-serif'
    }}>
      {/* 고요한 헤더 */}
      <header style={{
        background: `linear-gradient(to bottom, ${colors.secondary}, ${colors.primary})`,
        padding: '110px 20px 90px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          {space.profile_image && (
            <div style={{
              position: 'relative',
              display: 'inline-block',
              marginBottom: '40px'
            }}>
              <img
                src={space.profile_image}
                alt={space.display_name}
                style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `4px solid ${colors.accent}`,
                  filter: 'grayscale(20%)',
                  boxShadow: '0 10px 40px rgba(108, 117, 125, 0.2)'
                }}
              />
            </div>
          )}
          
          <h1 style={{ 
            fontSize: '50px', 
            fontWeight: '300', 
            color: colors.text,
            marginBottom: '24px',
            letterSpacing: '2px'
          }}>
            {space.display_name}
          </h1>
          
          <div style={{
            width: '2px',
            height: '40px',
            background: colors.accent,
            margin: '0 auto 24px',
            opacity: 0.5
          }}></div>

          <p style={{ 
            fontSize: '18px', 
            color: colors.text,
            marginBottom: '40px',
            fontWeight: '300',
            opacity: 0.8
          }}>
            {space.birth_date} — {space.death_date || 'Present'}
          </p>

          {space.memorial_message && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.6)',
              padding: '40px 50px',
              maxWidth: '720px',
              margin: '0 auto',
              borderTop: `1px solid ${colors.border}`,
              borderBottom: `1px solid ${colors.border}`
            }}>
              <p style={{
                fontSize: '17px',
                color: colors.text,
                lineHeight: 2,
                fontWeight: '300',
                textAlign: 'justify'
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
          maxWidth: '1300px', 
          margin: '110px auto',
          padding: '0 20px'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '70px'
          }}>
            <div style={{
              width: '2px',
              height: '50px',
              background: colors.accent,
              margin: '0 auto 28px',
              opacity: 0.5
            }}></div>
            <h2 style={{ 
              fontSize: '36px', 
              fontWeight: '300', 
              color: colors.text,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              opacity: 0.9
            }}>
              Memories
            </h2>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
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
                    filter: 'grayscale(30%)',
                    transition: 'all 0.5s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'grayscale(0%)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'grayscale(30%)';
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
        maxWidth: '950px', 
        margin: '130px auto',
        padding: '0 20px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '70px'
        }}>
          <div style={{
            width: '2px',
            height: '50px',
            background: colors.accent,
            margin: '0 auto 28px',
            opacity: 0.5
          }}></div>
          <h2 style={{ 
            fontSize: '36px', 
            fontWeight: '300', 
            color: colors.text,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            opacity: 0.9
          }}>
            Guestbook
          </h2>
        </div>
        
        {guestbook.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.5)',
            padding: '90px 40px',
            textAlign: 'center',
            borderTop: `1px solid ${colors.border}`,
            borderBottom: `1px solid ${colors.border}`
          }}>
            <p style={{ 
              color: colors.text,
              fontSize: '17px',
              fontWeight: '300',
              opacity: 0.7
            }}>
              The first message awaits
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: colors.border }}>
            {guestbook.map(entry => (
              <div key={entry.id} style={{
                background: colors.primary,
                padding: '50px 45px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '28px'
                }}>
                  <span style={{ 
                    fontWeight: '400', 
                    color: colors.accent,
                    fontSize: '19px',
                    letterSpacing: '1px'
                  }}>
                    {entry.author_name}
                  </span>
                  <span style={{ 
                    fontSize: '13px', 
                    color: colors.text,
                    opacity: 0.5,
                    fontWeight: '300',
                    letterSpacing: '1px'
                  }}>
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }).toUpperCase()}
                  </span>
                </div>
                <p style={{ 
                  color: colors.text,
                  lineHeight: 2.2,
                  whiteSpace: 'pre-wrap',
                  fontSize: '16px',
                  fontWeight: '300',
                  opacity: 0.9
                }}>
                  {entry.message}
                </p>
                {entry.image_url && (
                  <div style={{ marginTop: '30px' }}>
                    <img
                      src={`http://localhost:4000${entry.image_url}`}
                      alt="Attachment"
                      style={{
                        width: '100%',
                        maxWidth: '550px',
                        filter: 'grayscale(30%)'
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
        background: colors.secondary,
        padding: '80px 20px',
        textAlign: 'center',
        marginTop: '150px',
        borderTop: `1px solid ${colors.border}`
      }}>
        <div style={{
          width: '2px',
          height: '40px',
          background: colors.accent,
          margin: '0 auto 24px',
          opacity: 0.3
        }}></div>
        <p style={{ 
          color: colors.text,
          fontSize: '13px',
          fontWeight: '300',
          letterSpacing: '3px',
          opacity: 0.6,
          textTransform: 'uppercase'
        }}>
          Memento • In Memoriam
        </p>
      </footer>
    </div>
  );
}