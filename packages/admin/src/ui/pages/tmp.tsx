const Page = () => {
  return <div>hello</div>
}
export default Page

export const getConfig = async () => {
  return {
    render: "dynamic",
  } as const
}
