//src/pages/memorial/themes/CozyTheme.jsx 따뜻한

export default function CozyTheme({ data }) {
  const { space, photos, guestbook } = data;

  const colors = {
    primary: '#FFF8F0',
    secondary: '#F5E6D3',
    accent: '#D4A574',
    text: '#5D4E37',
    border: '#E8D5C4'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: colors.primary,
      fontFamily: '"Nanum Myeongjo", serif'
    }}>
      {/* 헤더 */}
      <header style={{
        background: `linear-gradient(to bottom, ${colors.secondary}, ${colors.primary})`,
        padding: '80px 20px 60px',
        textAlign: 'center'
      }}>
        {space.profile_image && (
          <img
            src={space.profile_image}
            alt={space.display_name}
            style={{
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `6px solid ${colors.accent}`,
              marginBottom: '24px',
              boxShadow: '0 10px 30px rgba(212, 165, 116, 0.3)'
            }}
          />
        )}
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: '400', 
          color: colors.text,
          marginBottom: '16px',
          letterSpacing: '2px'
        }}>
          {space.display_name}
        </h1>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255, 255, 255, 0.5)',
          padding: '12px 32px',
          borderRadius: '30px',
          marginBottom: '24px'
        }}>
          <p style={{ 
            fontSize: '18px', 
            color: colors.text,
            margin: 0
          }}>
            {space.birth_date} ~ {space.death_date || '현재'}
          </p>
        </div>
        {space.memorial_message && (
          <div style={{
            maxWidth: '700px',
            margin: '32px auto 0',
            background: 'rgba(255, 255, 255, 0.7)',
            padding: '32px',
            borderRadius: '16px',
            border: `2px solid ${colors.border}`
          }}>
            <p style={{
              fontSize: '17px',
              color: colors.text,
              lineHeight: 2,
              textAlign: 'justify'
            }}>
              "{space.memorial_message}"
            </p>
          </div>
        )}
      </header>

      {/* 사진 갤러리 */}
      {photos.length > 0 && (
        <section style={{ 
          maxWidth: '1200px', 
          margin: '80px auto',
          padding: '0 20px'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            <h2 style={{ 
              fontSize: '36px', 
              fontWeight: '400', 
              color: colors.text,
              marginBottom: '12px'
            }}>
              추억의 흔적
            </h2>
            <div style={{
              width: '60px',
              height: '3px',
              background: colors.accent,
              margin: '0 auto'
            }}></div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '32px'
          }}>
            {photos.map(photo => (
              <div key={photo.id} style={{ 
                position: 'relative',
                paddingTop: '100%'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '-8px',
                  right: '-8px',
                  bottom: '-8px',
                  background: colors.accent,
                  opacity: 0.2,
                  borderRadius: '8px'
                }}></div>
                <img
                  src={`http://localhost:4000${photo.image_url}`}
                  alt="추억"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(93, 78, 55, 0.15)'
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 방명록 */}
      <section style={{ 
        maxWidth: '900px', 
        margin: '80px auto',
        padding: '0 20px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '48px'
        }}>
          <h2 style={{ 
            fontSize: '36px', 
            fontWeight: '400', 
            color: colors.text,
            marginBottom: '12px'
          }}>
            방명록
          </h2>
          <div style={{
            width: '60px',
            height: '3px',
            background: colors.accent,
            margin: '0 auto'
          }}></div>
        </div>
        
        {guestbook.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.5)',
            padding: '60px',
            borderRadius: '16px',
            textAlign: 'center',
            border: `2px solid ${colors.border}`
          }}>
            <p style={{ 
              color: colors.text,
              fontSize: '17px',
              opacity: 0.7
            }}>
              아직 방명록이 없습니다
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {guestbook.map(entry => (
              <div key={entry.id} style={{
                background: 'rgba(255, 255, 255, 0.8)',
                padding: '32px',
                borderRadius: '16px',
                border: `2px solid ${colors.border}`,
                boxShadow: '0 4px 16px rgba(93, 78, 55, 0.1)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: `1px solid ${colors.border}`
                }}>
                  <span style={{ 
                    fontWeight: '600', 
                    color: colors.accent,
                    fontSize: '18px'
                  }}>
                    {entry.author_name}
                  </span>
                  <span style={{ 
                    fontSize: '14px', 
                    color: colors.text,
                    opacity: 0.6
                  }}>
                    {new Date(entry.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p style={{ 
                  color: colors.text,
                  lineHeight: 2,
                  whiteSpace: 'pre-wrap',
                  fontSize: '16px'
                }}>
                  {entry.message}
                </p>
                {entry.image_url && (
                  <img
                    src={`http://localhost:4000${entry.image_url}`}
                    alt="첨부 사진"
                    style={{
                      width: '100%',
                      maxWidth: '500px',
                      borderRadius: '12px',
                      marginTop: '20px',
                      border: `2px solid ${colors.border}`
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 푸터 */}
      <footer style={{
        background: colors.secondary,
        padding: '60px 20px',
        textAlign: 'center',
        marginTop: '100px'
      }}>
        <p style={{ 
          color: colors.text,
          fontSize: '15px',
          opacity: 0.7,
          letterSpacing: '1px'
        }}>
          Memento - 따뜻한 기억으로 함께합니다
        </p>
      </footer>
    </div>
  );
}