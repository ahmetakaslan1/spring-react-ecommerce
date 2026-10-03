package com.example.lesson10.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, CustomUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    // Gelen her istekte (Request) bu metot çalışacak
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. İstek (Request) başlığından "Authorization" kısmını alıyoruz
        final String authHeader = request.getHeader("Authorization");
        final String userEmail;
        final String jwtToken;

        // 2. Eğer başlık yoksa veya "Bearer " ile başlamıyorsa, bu filtreden iş çıkmaz deyip es geçiyoruz.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. "Bearer " kelimesinden (ilk 7 harf) sonraki asıl Token metnini alıyoruz
        jwtToken = authHeader.substring(7);
        userEmail = jwtUtil.extractEmail(jwtToken);

        // 4. Eğer email token'dan sorunsuz çıktıysa ve o an Spring Security sisteminde zaten giriş yapmış biri yoksa:
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Güvenlik görevlisinden adamın DB'deki rollerini ve bilgilerini getir diyoruz
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // Bilet geçerli mi? (Süresi dolmamış ve sahte değilse)
            if (jwtUtil.isTokenValid(jwtToken)) {
                
                // Spring Security'ye "Bu adam temiz ve biletli, kimlik kartını oluştur" diyoruz
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Oluşturulan bu kimlik kartını sistemin güvenlik bağlamına (Context) yerleştiriyoruz.
                // Artık Spring Security bu adamı "Giriş Yapmış" kabul edecek!
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 5. Kapıdaki kontrol bitti, isteği (örneğin /orders sayfasına gitmesini) serbest bırakıyoruz.
        filterChain.doFilter(request, response);
    }
}

