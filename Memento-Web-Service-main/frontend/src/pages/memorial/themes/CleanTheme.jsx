// src/pages/memorial/themes/CleanTheme.jsx 깔끔한
export default function CleanTheme({ data }) {
  const { space, photos, guestbook } = data;

  const colors = {
    primary: '#FFFFFF',
    secondary: '#F0F7FF',
    accent: '#3B82F6',
    text: '#1E40AF',
    border: '#BFDBFE'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: `linear-gradient(to bottom, ${colors.secondary}, ${colors.primary})`,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* 헤더 */}
      <header style={{
        background: colors.primary,
        borderBottom: `2px solid ${colors.border}`,
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        {space.profile_image && (
          <img
            src={space.profile_image}
            alt={space.display_name}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `4px solid ${colors.accent}`,
              marginBottom: '20px'
            }}
          />
        )}
        <h1 style={{ 
          fontSize: '36px', 
          fontWeight: '700', 
          color: colors.text,
          marginBottom: '8px'
        }}>
          {space.display_name}
        </h1>
        <p style={{ 
          fontSize: '18px', 
          color: colors.text,
          opacity: 0.7
        }}>
          {space.birth_date} ~ {space.death_date || '현재'}
        </p>
        {space.memorial_message && (
          <p style={{
            fontSize: '16px',
            color: colors.text,
            marginTop: '20px',
            maxWidth: '600px',
            margin: '20px auto 0',
            lineHeight: 1.6
          }}>
            {space.memorial_message}
          </p>
        )}
      </header>

      {/* 사진 갤러리 */}
      {photos.length > 0 && (
        <section style={{ 
          maxWidth: '1200px', 
          margin: '60px auto',
          padding: '0 20px'
        }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '600', 
            color: colors.text,
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            추억의 순간들
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {photos.map(photo => (
              <div key={photo.id} style={{ 
                position: 'relative',
                paddingTop: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: `2px solid ${colors.border}`
              }}>
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
        maxWidth: '800px', 
        margin: '60px auto',
        padding: '0 20px'
      }}>
        <h2 style={{ 
          fontSize: '28px', 
          fontWeight: '600', 
          color: colors.text,
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          방명록
        </h2>
        
        {guestbook.length === 0 ? (
          <p style={{ 
            textAlign: 'center', 
            color: colors.text,
            opacity: 0.6,
            fontSize: '16px'
          }}>
            아직 방명록이 없습니다.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {guestbook.map(entry => (
              <div key={entry.id} style={{
                background: colors.primary,
                padding: '20px',
                borderRadius: '12px',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <span style={{ 
                    fontWeight: '600', 
                    color: colors.text 
                  }}>
                    {entry.author_name}
                  </span>
                  <span style={{ 
                    fontSize: '14px', 
                    color: colors.text,
                    opacity: 0.6
                  }}>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ 
                  color: colors.text,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}>
                  {entry.message}
                </p>
                {entry.image_url && (
                  <img
                    src={`http://localhost:4000${entry.image_url}`}
                    alt="첨부 사진"
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      borderRadius: '8px',
                      marginTop: '12px'
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
        borderTop: `1px solid ${colors.border}`,
        padding: '40px 20px',
        textAlign: 'center',
        marginTop: '80px'
      }}>
        <p style={{ 
          color: colors.text,
          opacity: 0.6,
          fontSize: '14px'
        }}>
          Memento - 소중한 추억을 영원히
        </p>
      </footer>
    </div>
  );
}