//frontend/src/pages/memorial/themes/SoftTheme.jsx 부드러운

export default function SoftTheme({ data }) {
  const { space, photos, guestbook } = data;

  const colors = {
  primary: '#F8F3FF',
  secondary: '#EDE2FF',
  accent: '#C3A4FF',
  text: '#5C4B73',
  border: '#DCD0F0'
};

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: `radial-gradient(circle at top right, ${colors.secondary}, ${colors.primary})`,
      fontFamily: '"Noto Sans KR", sans-serif'
    }}>
      {/* 부드러운 헤더 */}
      <header style={{
        background: `linear-gradient(135deg, ${colors.secondary}80, transparent)`,
        padding: '90px 20px 80px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* 반짝이는 별 장식 */}
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '20%',
          fontSize: '24px',
          animation: 'twinkle 2s infinite'
        }}>✨</div>
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '25%',
          fontSize: '20px',
          animation: 'twinkle 3s infinite'
        }}>⭐</div>

        {space.profile_image && (
          <div style={{
            position: 'relative',
            display: 'inline-block',
            marginBottom: '32px'
          }}>
            <div style={{
              position: 'absolute',
              top: '-15px',
              left: '-15px',
              right: '-15px',
              bottom: '-15px',
              background: `radial-gradient(circle, ${colors.accent}40, transparent)`,
              borderRadius: '50%',
              filter: 'blur(20px)'
            }}></div>
            <img
              src={space.profile_image}
              alt={space.display_name}
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `4px solid ${colors.accent}`,
                position: 'relative',
                zIndex: 1,
                boxShadow: '0 10px 40px rgba(181, 137, 214, 0.3)'
              }}
            />
          </div>
        )}
        
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: '300', 
          color: colors.accent,
          marginBottom: '16px',
          letterSpacing: '1px'
        }}>
          {space.display_name}
        </h1>
        
        <div style={{
          display: 'inline-block',
          background: 'rgba(255, 255, 255, 0.7)',
          padding: '14px 36px',
          borderRadius: '50px',
          border: `2px solid ${colors.border}`,
          backdropFilter: 'blur(10px)',
          marginBottom: '32px'
        }}>
          <p style={{ 
            fontSize: '17px', 
            color: colors.text,
            margin: 0
          }}>
            ✨ {space.birth_date} ~ {space.death_date || '현재'} ✨
          </p>
        </div>

        {space.memorial_message && (
          <div style={{
            maxWidth: '680px',
            margin: '0 auto',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '36px 44px',
            borderRadius: '24px',
            border: `2px solid ${colors.border}`,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(181, 137, 214, 0.2)'
          }}>
            <p style={{
              fontSize: '17px',
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
              fontSize: '38px', 
              fontWeight: '300', 
              color: colors.accent,
              marginBottom: '16px'
            }}>
              ✨ 별처럼 빛나는 순간들 ✨
            </h2>
            <div style={{
              width: '120px',
              height: '2px',
              background: `linear-gradient(to right, transparent, ${colors.accent}, transparent)`,
              margin: '0 auto'
            }}></div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '28px'
          }}>
            {photos.map(photo => (
              <div key={photo.id} style={{ 
                position: 'relative',
                paddingTop: '100%'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '-10px',
                  right: '-10px',
                  bottom: '-10px',
                  background: `radial-gradient(circle, ${colors.accent}30, transparent)`,
                  borderRadius: '20px',
                  filter: 'blur(15px)',
                  opacity: 0,
                  transition: 'opacity 0.3s'
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
                    borderRadius: '20px',
                    border: `3px solid ${colors.border}`,
                    boxShadow: '0 8px 24px rgba(181, 137, 214, 0.2)',
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(181, 137, 214, 0.35)';
                    e.currentTarget.previousSibling.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(181, 137, 214, 0.2)';
                    e.currentTarget.previousSibling.style.opacity = '0';
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
            fontSize: '38px', 
            fontWeight: '300', 
            color: colors.accent,
            marginBottom: '16px'
          }}>
            💜 방명록 💜
          </h2>
          <div style={{
            width: '120px',
            height: '2px',
            background: `linear-gradient(to right, transparent, ${colors.accent}, transparent)`,
            margin: '0 auto'
          }}></div>
        </div>
        
        {guestbook.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            padding: '70px 40px',
            borderRadius: '24px',
            textAlign: 'center',
            border: `2px solid ${colors.border}`,
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⭐</div>
            <p style={{ 
              color: colors.text,
              fontSize: '17px',
              fontWeight: '300'
            }}>
              첫 번째 별빛 같은 메시지를 남겨주세요
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {guestbook.map((entry, index) => (
              <div key={entry.id} style={{
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '32px',
                borderRadius: '20px',
                border: `2px solid ${colors.border}`,
                boxShadow: '0 6px 20px rgba(181, 137, 214, 0.15)',
                backdropFilter: 'blur(10px)',
                position: 'relative'
              }}>
                {index % 3 === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    fontSize: '20px',
                    opacity: 0.3
                  }}>✨</div>
                )}
                
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
                    fontSize: '19px'
                  }}>
                    💫 {entry.author_name}
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
                  fontSize: '16px',
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
                      maxWidth: '460px',
                      borderRadius: '16px',
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
        background: `linear-gradient(to top, ${colors.secondary}60, transparent)`,
        padding: '70px 20px',
        textAlign: 'center',
        marginTop: '120px'
      }}>
        <p style={{ 
          color: colors.text,
          fontSize: '15px',
          fontWeight: '300'
        }}>
          ✨ Memento - 별빛처럼 영원히 빛나는 기억 ✨
        </p>
      </footer>

      {/* CSS 애니메이션 */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}