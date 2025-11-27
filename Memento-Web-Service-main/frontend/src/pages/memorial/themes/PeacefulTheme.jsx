//frontend/src/pages/memorial/themes/PeacefulTheme.jsx 평화로운

export default function PeacefulTheme({ data }) {
  const { space, photos, guestbook } = data;

  const colors = {
  primary: '#F3FAF7',
  secondary: '#DDF3E6',
  accent: '#7CCFD4',
  text: '#2F5F52',
  border: '#C4E8DC'
};

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* 물결 효과 헤더 */}
      <header style={{
        background: `linear-gradient(to bottom, ${colors.secondary}, transparent)`,
        padding: '90px 20px 70px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '60px',
          background: `repeating-linear-gradient(90deg, transparent, transparent 10px, ${colors.border} 10px, ${colors.border} 20px)`,
          opacity: 0.3
        }}></div>

        {space.profile_image && (
          <img
            src={space.profile_image}
            alt={space.display_name}
            style={{
              width: '145px',
              height: '145px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `4px solid ${colors.accent}`,
              marginBottom: '28px',
              boxShadow: '0 10px 30px rgba(90, 185, 193, 0.3)'
            }}
          />
        )}
        <h1 style={{ 
          fontSize: '42px', 
          fontWeight: '300', 
          color: colors.text,
          marginBottom: '12px',
          letterSpacing: '3px'
        }}>
          {space.display_name}
        </h1>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.7)',
          padding: '10px 28px',
          borderRadius: '50px',
          marginBottom: '28px'
        }}>
          <span style={{ fontSize: '20px' }}>🕊️</span>
          <p style={{ 
            fontSize: '17px', 
            color: colors.text,
            margin: 0
          }}>
            {space.birth_date} ~ {space.death_date || '현재'}
          </p>
        </div>
        {space.memorial_message && (
          <div style={{
            maxWidth: '680px',
            margin: '0 auto',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '32px',
            borderRadius: '20px',
            border: `2px solid ${colors.border}`,
            backdropFilter: 'blur(10px)'
          }}>
            <p style={{
              fontSize: '16px',
              color: colors.text,
              lineHeight: 2,
              fontWeight: '300'
            }}>
              {space.memorial_message}
            </p>
          </div>
        )}
      </header>

      {/* 사진 갤러리 */}
      {photos.length > 0 && (
        <section style={{ 
          maxWidth: '1200px', 
          margin: '90px auto',
          padding: '0 20px'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '50px'
          }}>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: '300', 
              color: colors.text,
              letterSpacing: '2px',
              marginBottom: '16px'
            }}>
              고요한 순간들
            </h2>
            <div style={{
              width: '100px',
              height: '2px',
              background: colors.accent,
              margin: '0 auto'
            }}></div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '30px'
          }}>
            {photos.map(photo => (
              <div key={photo.id} style={{ 
                position: 'relative',
                paddingTop: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(90, 185, 193, 0.2)',
                border: `3px solid ${colors.border}`,
                transition: 'all 0.4s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(90, 185, 193, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(90, 185, 193, 0.2)';
              }}
              >
                <img
                  src={`http://localhost:4000${photo.image_url}`}
                  alt="추억"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 방명록 */}
      <section style={{ 
        maxWidth: '880px', 
        margin: '100px auto',
        padding: '0 20px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '50px'
        }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '300', 
            color: colors.text,
            letterSpacing: '2px',
            marginBottom: '16px'
          }}>
            방명록
          </h2>
          <div style={{
            width: '100px',
            height: '2px',
            background: colors.accent,
            margin: '0 auto'
          }}></div>
        </div>
        
        {guestbook.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            padding: '60px',
            borderRadius: '20px',
            textAlign: 'center',
            border: `2px solid ${colors.border}`
          }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🕊️</span>
            <p style={{ 
              color: colors.text,
              fontSize: '17px',
              fontWeight: '300'
            }}>
              첫 메시지를 남겨주세요
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {guestbook.map(entry => (
              <div key={entry.id} style={{
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '32px',
                borderRadius: '16px',
                border: `2px solid ${colors.border}`,
                boxShadow: '0 4px 16px rgba(90, 185, 193, 0.1)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(90, 185, 193, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(90, 185, 193, 0.1)';
              }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: `1px solid ${colors.border}`
                }}>
                  <span style={{ 
                    fontWeight: '400', 
                    color: colors.accent,
                    fontSize: '18px',
                    letterSpacing: '0.5px'
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
                  fontSize: '15px',
                  fontWeight: '300'
                }}>
                  {entry.message}
                </p>
                {entry.image_url && (
                  <img
                    src={`http://localhost:4000${entry.image_url}`}
                    alt="첨부 사진"
                    style={{
                      width: '100%',
                      maxWidth: '480px',
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
        marginTop: '120px'
      }}>
        <p style={{ 
          color: colors.text,
          fontSize: '14px',
          fontWeight: '300',
          letterSpacing: '1px'
        }}>
          🕊️ Memento - 평화로운 안식을 기원합니다
        </p>
      </footer>
    </div>
  );
}