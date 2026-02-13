import { checkAdmin } from './_lib/checkAdmin.js'

export default async function handler(req, res) {
  const admin = await checkAdmin(req)
  if (admin.authorized) {
    return res.status(200).json({ admin: true })
  } else {
    return res.status(403).json({ admin: false, error: admin.error })
  }
}
