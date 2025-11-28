//src/pages/memorial/themes/WarmTheme.jsx 따뜻한

export default function WarmTheme({ data }) {
  const { space, photos, guestbook } = data;

  const colors = {
  primary: '#FFF8E1',
  secondary: '#FFE4B3',
  accent: '#FFB873',
  text: '#5A4A32',
  border: '#FFD9A6'
};


  return (
    <div style={{ 
      minHeight: '100vh', 
      background: `linear-gradient(to bottom, ${colors.secondary}, ${colors.primary})`,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* 햇살 효과 헤더 */}
      <header style={{
        background: `radial-gradient(circle at top, ${colors.secondary}, ${colors.primary})`,
        padding: '70px 20px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '64px',
          opacity: 0.3
        }}>☀️</div>

        {space.profile_image && (
          <img
            src={space.profile_image}
            alt={space.display_name}
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `5px solid ${colors.accent}`,
              marginBottom: '24px',
              boxShadow: `0 0 40px rgba(255, 140, 66, 0.4)`,
              position: 'relative',
              zIndex: 1
            }}
          />
        )}
        <h1 style={{ 
          fontSize: '44px', 
          fontWeight: '800', 
          color: colors.accent,
          marginBottom: '16px',
          textShadow: '2px 2px 8px rgba(255, 140, 66, 0.2)'
        }}>
          {space.display_name}
        </h1>
        <p style={{ 
          fontSize: '20px', 
          color: colors.text,
          fontWeight: '500'
        }}>
          {space.birth_date} ~ {space.death_date || '현재'}
        </p>
        {space.memorial_message && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '28px',
            borderRadius: '16px',
            maxWidth: '650px',
            margin: '32px auto 0',
            border: `3px solid ${colors.accent}`,
            boxShadow: '0 8px 24px rgba(255, 140, 66, 0.2)'
          }}>
            <p style={{
              fontSize: '17px',
              color: colors.text,
              lineHeight: 1.8,
              fontWeight: '500'
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
          margin: '70px auto',
          padding: '0 20px'
        }}>
          <h2 style={{ 
            fontSize: '34px', 
            fontWeight: '700', 
            color: colors.accent,
            marginBottom: '40px',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(255, 140, 66, 0.1)'
          }}>
            🌻 빛나는 순간들 🌻
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '28px'
          }}>
            {photos.map(photo => (
              <div key={photo.id} style={{ 
                position: 'relative',
                paddingTop: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(255, 140, 66, 0.25)',
                border: `4px solid ${colors.accent}`,
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) rotate(2deg)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 140, 66, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 140, 66, 0.25)';
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
        maxWidth: '850px', 
        margin: '80px auto',
        padding: '0 20px'
      }}>
        <h2 style={{ 
          fontSize: '34px', 
          fontWeight: '700', 
          color: colors.accent,
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          ✨ 방명록 ✨
        </h2>
        
        {guestbook.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.6)',
            padding: '50px',
            borderRadius: '16px',
            textAlign: 'center',
            border: `3px solid ${colors.border}`
          }}>
            <p style={{ 
              color: colors.text,
              fontSize: '18px',
              fontWeight: '500'
            }}>
              첫 방명록을 남겨주세요 🌟
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {guestbook.map(entry => (
              <div key={entry.id} style={{
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '28px',
                borderRadius: '16px',
                border: `3px solid ${colors.border}`,
                boxShadow: '0 6px 20px rgba(255, 140, 66, 0.15)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(255, 140, 66, 0.25)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 140, 66, 0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <span style={{ 
                    fontWeight: '700', 
                    color: colors.accent,
                    fontSize: '18px'
                  }}>
                    ☀️ {entry.author_name}
                  </span>
                  <span style={{ 
                    fontSize: '14px', 
                    color: colors.text,
                    opacity: 0.7
                  }}>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ 
                  color: colors.text,
                  lineHeight: 1.8,
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
                      maxWidth: '450px',
                      borderRadius: '12px',
                      marginTop: '16px',
                      border: `3px solid ${colors.border}`
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
        padding: '50px 20px',
        textAlign: 'center',
        marginTop: '100px'
      }}>
        <p style={{ 
          color: colors.text,
          fontSize: '15px',
          fontWeight: '600'
        }}>
          ☀️ Memento - 따뜻한 햇살처럼 기억합니다 ☀️
        </p>
      </footer>
    </div>
  );
}