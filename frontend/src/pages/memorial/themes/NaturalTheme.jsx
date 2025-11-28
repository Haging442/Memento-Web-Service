//frontend/src/pages/memorial/themes/NaturalTheme.jsx 자연스러운

export default function NaturalTheme({ data }) {
  const { space, photos, guestbook } = data;

  const colors = {
  primary: '#F6F4ED',
  secondary: '#E3EDD7',
  accent: '#BBA27A',
  text: '#4F5A3A',
  border: '#D7CDB7'
};


  return (
    <div style={{ 
      minHeight: '100vh', 
      background: colors.primary,
      fontFamily: '"Noto Sans KR", sans-serif'
    }}>
      {/* 자연 느낌 헤더 */}
      <header style={{
        background: `linear-gradient(to bottom, ${colors.secondary}, ${colors.primary})`,
        padding: '80px 20px 70px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* 나뭇잎 장식 */}
        <div style={{
          position: 'absolute',
          top: '30px',
          left: '10%',
          fontSize: '40px',
          opacity: 0.2
        }}>🍃</div>
        <div style={{
          position: 'absolute',
          top: '50px',
          right: '15%',
          fontSize: '35px',
          opacity: 0.2
        }}>🌿</div>

        {space.profile_image && (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={space.profile_image}
              alt={space.display_name}
              style={{
                width: '155px',
                height: '155px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `5px solid ${colors.accent}`,
                marginBottom: '28px',
                boxShadow: '0 10px 30px rgba(107, 142, 78, 0.25)'
              }}
            />
            <div style={{
              position: 'absolute',
              top: '-15px',
              right: '-10px',
              fontSize: '48px'
            }}>🌱</div>
          </div>
        )}
        
        <h1 style={{ 
          fontSize: '46px', 
          fontWeight: '600', 
          color: colors.accent,
          marginBottom: '16px'
        }}>
          {space.display_name}
        </h1>
        
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '12px 32px',
          borderRadius: '50px',
          border: `2px solid ${colors.border}`,
          marginBottom: '32px'
        }}>
          <span>🌳</span>
          <p style={{ 
            fontSize: '18px', 
            color: colors.text,
            margin: 0,
            fontWeight: '500'
          }}>
            {space.birth_date} ~ {space.death_date || '현재'}
          </p>
        </div>

        {space.memorial_message && (
          <div style={{
            maxWidth: '700px',
            margin: '0 auto',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '32px 40px',
            borderRadius: '16px',
            border: `3px solid ${colors.border}`,
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-15px',
              left: '30px',
              fontSize: '30px'
            }}>🍀</div>
            <p style={{
              fontSize: '17px',
              color: colors.text,
              lineHeight: 1.9
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
          margin: '80px auto',
          padding: '0 20px'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '50px'
          }}>
            <h2 style={{ 
              fontSize: '36px', 
              fontWeight: '600', 
              color: colors.accent,
              marginBottom: '16px'
            }}>
              🌲 자연 속의 추억 🌲
            </h2>
            <div style={{
              width: '80px',
              height: '3px',
              background: colors.accent,
              margin: '0 auto',
              borderRadius: '2px'
            }}></div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '32px'
          }}>
            {photos.map((photo, index) => (
              <div key={photo.id} style={{ 
                position: 'relative',
                paddingTop: '100%'
              }}>
                {/* 배경 잎 장식 */}
                {index % 3 === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '-12px',
                    fontSize: '32px',
                    opacity: 0.3,
                    zIndex: 0
                  }}>🍃</div>
                )}
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
                    borderRadius: '12px',
                    border: `4px solid ${colors.border}`,
                    boxShadow: '0 8px 24px rgba(107, 142, 78, 0.15)',
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(107, 142, 78, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(107, 142, 78, 0.15)';
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
        margin: '90px auto',
        padding: '0 20px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '50px'
        }}>
          <h2 style={{ 
            fontSize: '36px', 
            fontWeight: '600', 
            color: colors.accent,
            marginBottom: '16px'
          }}>
            🌿 방명록 🌿
          </h2>
          <div style={{
            width: '80px',
            height: '3px',
            background: colors.accent,
            margin: '0 auto',
            borderRadius: '2px'
          }}></div>
        </div>
        
        {guestbook.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '60px 40px',
            borderRadius: '16px',
            textAlign: 'center',
            border: `3px solid ${colors.border}`
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
            <p style={{ 
              color: colors.text,
              fontSize: '17px'
            }}>
              첫 메시지를 남겨주세요
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {guestbook.map((entry, index) => (
              <div key={entry.id} style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '32px',
                borderRadius: '16px',
                border: `3px solid ${colors.border}`,
                boxShadow: '0 6px 20px rgba(107, 142, 78, 0.12)',
                position: 'relative'
              }}>
                {/* 랜덤 잎 장식 */}
                {index % 2 === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    fontSize: '24px',
                    opacity: 0.2
                  }}>🍃</div>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: `2px solid ${colors.border}`
                }}>
                  <span style={{ 
                    fontWeight: '600', 
                    color: colors.accent,
                    fontSize: '19px'
                  }}>
                    🌿 {entry.author_name}
                  </span>
                  <span style={{ 
                    fontSize: '14px', 
                    color: colors.text,
                    opacity: 0.7
                  }}>
                    {new Date(entry.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p style={{ 
                  color: colors.text,
                  lineHeight: 1.9,
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
                      maxWidth: '480px',
                      borderRadius: '12px',
                      marginTop: '20px',
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
        padding: '60px 20px',
        textAlign: 'center',
        marginTop: '100px'
      }}>
        <p style={{ 
          color: colors.text,
          fontSize: '15px',
          fontWeight: '500'
        }}>
          🌳 Memento - 자연으로 돌아가는 평안한 쉼 🌳
        </p>
      </footer>
    </div>
  );
}