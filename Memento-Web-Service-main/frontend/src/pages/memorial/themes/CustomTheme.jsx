// src/pages/memorial/themes/CustomTheme.jsx

export default function CustomTheme({ data, themeColors }) {
  const { space, photos, guestbook } = data;

  // AI가 생성한 색상 사용
  const colors = {
    primary: themeColors.primary,
    secondary: themeColors.secondary,
    accent: themeColors.accent,
    text: themeColors.text,
    border: themeColors.accent  // 보더는 accent 색상 사용
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: colors.primary || colors.secondary,
      fontFamily: '"Playfair Display", "Noto Serif KR", serif'
    }}>
      {/* 우아한 헤더 */}
      <header style={{
        background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
        padding: '100px 20px 80px',
        textAlign: 'center',
        borderBottom: `1px solid ${colors.border}`
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {space.profile_image && (
            <div style={{
              position: 'relative',
              display: 'inline-block',
              marginBottom: '36px'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '-10px',
                right: '-10px',
                bottom: '-10px',
                border: `2px solid ${colors.accent}`,
                borderRadius: '50%'
              }}></div>
              <img
                src={space.profile_image}
                alt={space.display_name}
                style={{
                  width: '170px',
                  height: '170px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `5px solid ${colors.primary}`,
                  position: 'relative',
                  zIndex: 1
                }}
              />
            </div>
          )}
          
          <div style={{
            marginBottom: '20px'
          }}>
            <div style={{
              width: '80px',
              height: '1px',
              background: colors.accent,
              margin: '0 auto 24px'
            }}></div>
            <h1 style={{ 
              fontSize: '52px', 
              fontWeight: '400', 
              color: colors.text,
              marginBottom: '8px',
              letterSpacing: '1px'
            }}>
              {space.display_name}
            </h1>
            <div style={{
              width: '80px',
              height: '1px',
              background: colors.accent,
              margin: '24px auto 0'
            }}></div>
          </div>

          <p style={{ 
            fontSize: '19px', 
            color: colors.text,
            fontWeight: '300',
            letterSpacing: '2px',
            marginBottom: '40px'
          }}>
            {space.birth_date} – {space.death_date || 'Present'}
          </p>

          {space.memorial_message && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.5)',
              padding: '40px 48px',
              borderLeft: `4px solid ${colors.accent}`,
              borderRight: `4px solid ${colors.accent}`,
              maxWidth: '750px',
              margin: '0 auto'
            }}>
              <p style={{
                fontSize: '18px',
                color: colors.text,
                lineHeight: 2,
                fontStyle: 'italic',
                fontWeight: '300'
              }}>
                " {space.memorial_message} "
              </p>
            </div>
          )}
        </div>
      </header>

      {/* 사진 갤러리 */}
      {photos.length > 0 && (
        <section style={{ 
          maxWidth: '1300px', 
          margin: '100px auto',
          padding: '0 20px'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '60px'
          }}>
            <div style={{
              width: '60px',
              height: '1px',
              background: colors.accent,
              margin: '0 auto 28px'
            }}></div>
            <h2 style={{ 
              fontSize: '38px', 
              fontWeight: '400', 
              color: colors.text,
              letterSpacing: '2px',
              marginBottom: '12px'
            }}>
              Memories
            </h2>
            <p style={{
              fontSize: '16px',
              color: colors.text,
              opacity: 0.6,
              fontWeight: '300'
            }}>
              소중한 기억들
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {photos.map(photo => (
              <div key={photo.id} style={{ 
                position: 'relative',
                paddingTop: '100%'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  right: '-8px',
                  bottom: '-8px',
                  border: `1px solid ${colors.border}`,
                  zIndex: 0
                }}></div>
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
                    border: `1px solid ${colors.border}`,
                    zIndex: 1,
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate(-4px, -4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translate(0, 0)';
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
        margin: '120px auto',
        padding: '0 20px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <div style={{
            width: '60px',
            height: '1px',
            background: colors.accent,
            margin: '0 auto 28px'
          }}></div>
          <h2 style={{ 
            fontSize: '38px', 
            fontWeight: '400', 
            color: colors.text,
            letterSpacing: '2px',
            marginBottom: '12px'
          }}>
            Guestbook
          </h2>
          <p style={{
            fontSize: '16px',
            color: colors.text,
            opacity: 0.6,
            fontWeight: '300'
          }}>
            방명록
          </p>
        </div>
        
        {guestbook.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.5)',
            padding: '80px 40px',
            textAlign: 'center',
            border: `1px solid ${colors.border}`
          }}>
            <p style={{ 
              color: colors.text,
              fontSize: '17px',
              fontWeight: '300',
              fontStyle: 'italic'
            }}>
              첫 번째 메시지를 남겨주세요
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {guestbook.map(entry => (
              <div key={entry.id} style={{
                background: 'rgba(255, 255, 255, 0.7)',
                padding: '40px',
                border: `1px solid ${colors.border}`,
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '4px',
                  height: '60px',
                  background: colors.accent
                }}></div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '24px'
                }}>
                  <span style={{ 
                    fontWeight: '500', 
                    color: colors.accent,
                    fontSize: '20px',
                    letterSpacing: '0.5px'
                  }}>
                    {entry.author_name}
                  </span>
                  <span style={{ 
                    fontSize: '13px', 
                    color: colors.text,
                    opacity: 0.5,
                    fontWeight: '300'
                  }}>
                    {new Date(entry.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
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
                  <div style={{ marginTop: '24px' }}>
                    <img
                      src={`http://localhost:4000${entry.image_url}`}
                      alt="Attachment"
                      style={{
                        width: '100%',
                        maxWidth: '500px',
                        border: `1px solid ${colors.border}`
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
        marginTop: '140px',
        borderTop: `1px solid ${colors.border}`
      }}>
        <div style={{
          width: '60px',
          height: '1px',
          background: colors.accent,
          margin: '0 auto 20px'
        }}></div>
        <p style={{ 
          color: colors.text,
          fontSize: '14px',
          fontWeight: '300',
          letterSpacing: '2px',
          opacity: 0.7
        }}>
          MEMENTO • IN LOVING MEMORY
        </p>
      </footer>
    </div>
  );
}