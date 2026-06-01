using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Sicsoft.Checkin.Web
{
    [AllowAnonymous]
    public class LogoutModel : PageModel
    {
        public void OnGet()
        {

        }

        public async Task<IActionResult> OnPost(string returnUrl = null)
        {
            var userEmail = User?.FindFirst("preferred_username")?.Value
                ?? User?.FindFirst("email")?.Value
                ?? User?.FindFirst("upn")?.Value
                ?? User?.Identity?.Name;

            var cerrarSesion365 = !string.IsNullOrEmpty(userEmail)
                && userEmail.EndsWith("@amvac.com", StringComparison.OrdinalIgnoreCase);

            await HttpContext.SignOutAsync();

            if (cerrarSesion365)
            {
                var redirectUrl = $"{Request.Scheme}://{Request.Host}/Account/Login";
                var microsoftLogoutUrl =
                    "https://login.microsoftonline.com/common/oauth2/v2.0/logout" +
                    "?post_logout_redirect_uri=" + WebUtility.UrlEncode(redirectUrl);

                return Redirect(microsoftLogoutUrl);
            }

            //_logger.LogInformation("User logged out.");
            if (returnUrl != null)
            {
                return LocalRedirect(returnUrl);
            }
            else
            {
                // This needs to be a redirect so that the browser performs a new
                // request and the identity for the user gets updated.
                // return RedirectToPage();
                string url = "/Account/Login";

                return Redirect("./Index");
            }
        }
    }
}
