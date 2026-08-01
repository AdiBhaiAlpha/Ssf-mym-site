package app.ssf.mym

import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.security.MessageDigest
import java.util.UUID

@CapacitorPlugin(name = "NativeGoogleAuth")
class NativeGoogleAuthPlugin : Plugin() {

    @PluginMethod
    fun signIn(call: PluginCall) {
        val clientId = call.getString("clientId") ?: "953122849300-88n085h13a52862d53g58f.apps.googleusercontent.com"
        
        val credentialManager = CredentialManager.create(context)
        
        // Generate a random nonce
        val rawNonce = UUID.randomUUID().toString()
        val bytes = rawNonce.toByteArray()
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(bytes)
        val hashedNonce = digest.joinToString("") { "%02x".format(it) }

        val googleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(clientId)
            .setNonce(hashedNonce)
            .build()

        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = credentialManager.getCredential(
                    request = request,
                    context = activity,
                )

                val credential = result.credential

                if (credential is com.google.android.libraries.identity.googleid.GoogleIdTokenCredential) {
                    val idToken = credential.idToken
                    val ret = JSObject()
                    ret.put("idToken", idToken)
                    ret.put("displayName", credential.displayName)
                    ret.put("profilePictureUri", credential.profilePictureUri?.toString())
                    ret.put("id", credential.id)
                    call.resolve(ret)
                } else if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                    val idToken = googleIdTokenCredential.idToken
                    val ret = JSObject()
                    ret.put("idToken", idToken)
                    ret.put("displayName", googleIdTokenCredential.displayName)
                    ret.put("profilePictureUri", googleIdTokenCredential.profilePictureUri?.toString())
                    ret.put("id", googleIdTokenCredential.id)
                    call.resolve(ret)
                } else {
                    call.reject("Unexpected type of credential")
                }
            } catch (e: androidx.credentials.exceptions.GetCredentialCancellationException) {
                Log.d("NativeGoogleAuth", "GetCredentialCancellationException", e)
                call.reject("credential_cancelled")
            } catch (e: GetCredentialException) {
                Log.e("NativeGoogleAuth", "GetCredentialException: ${e.type}", e)
                call.reject("credential_error: " + (e.message ?: e.type))
            } catch (e: Exception) {
                Log.e("NativeGoogleAuth", "Unknown exception", e)
                call.reject("unknown_error: " + (e.message ?: "Unknown error occurred"))
            }
        }
    }
}
